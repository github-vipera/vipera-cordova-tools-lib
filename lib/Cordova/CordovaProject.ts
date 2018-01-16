'use babel'

/*!
 * CordovaProject
 * 
 * Vipera Tools
 * Copyright(c) 2017 Dynamic Engine Team @ Vipera Plc
 * MIT Licensed
 */


const path = require("path");
const fs = require("fs");
const _ = require('lodash');
const jsonfile = require('jsonfile')
const winston = require('winston');
import { CordovaPluginScanner } from './CordovaPluginScanner'
import { ResourceManager } from '../Utils/ResourceManager'
import { CordovaExecutor } from './CordovaExecutor'


export class CordovaPlatform {
    name: string;
    version : string;
    basePath : string;
    assetsPath : string;
    sourcesPath : string;
}


export class CordovaPlugin {
    public name: string;
    public id: string;
    public version: string;
    public description: string;
    public isTopLevel: boolean;
    public info: any;
    public installed: boolean = false;
    public author:string = '';
    public homepage:string = '';
    public license:string = '';
    public repository:string = '';
    public repositoryType:string = '';
    public sourceType:string = '';
    public lastUpdateTime:string = '';
    public rating:number = 0;
    public localPath:string = '';
    public platforms:Array<string> = [];
}


export interface CordovaProjectInfo {
    path:string;
    name:string;
    displayName:string;
    description:string;
    author:string;
    license:string;
    version:string;
    platforms:Array<CordovaPlatform>;
    variants:Array<string>;
    projectSettings?:any;
    plugins?:Array<CordovaPlugin>;
    npmScripts?:Array<string>;
  }
  
  
  

export class CordovaProject {

    private _projectPath:string;
    private _packageJson:any;
    private _isDirty:boolean;

    constructor(){
        this._isDirty = false;
    } 

    public isCordovaProject():boolean {
        if (!this._packageJson.cordova || !this._packageJson.cordova.platforms){
            return false;
        } else {
            return true;
        }
    }

    public loadFromPath(projectPath:string){
        this._projectPath = projectPath;
        this._packageJson = this.loadPackageJSON(this._projectPath);
    }

    public getInstalledPlatforms():Array<CordovaPlatform> {
        
        winston.log("debug", "getInstalledPlatforms called");

        //not a Cordova project?
        if (!this.isCordovaProject()){
            throw new Error('This is not a Cordova Project');
        }

        var platformList = this._packageJson.cordova.platforms;

        var platforms = [];
    
        for (var i=0;i<platformList.length;i++){
            var platformInfo = this.getPlatformInfo(platformList[i]);
            platforms.push(platformInfo);
        }
    
        return platforms;
    }

    
    public getPlatformInfo(platformName:string):CordovaPlatform {
        var platformVer = '0.0.0';

        if (this._packageJson.dependencies){
            var depName = "cordova-" + platformName;
            var versionStr = this._packageJson.dependencies[depName] || '';
            if(versionStr){
                platformVer = versionStr.replace(/^[^0-9]+/, '');
            }
        }
    
        var platform = new CordovaPlatform();
        platform.name = platformName;
        platform.version = platformVer;
        platform.basePath = this._projectPath;
        platform.assetsPath =  this.toAbsolutePath(path.join('platforms', platformName , this.assetsFolderForPlatform(platformName, platformVer)));
        platform.sourcesPath =  this.toAbsolutePath(path.join('platforms', platformName , this.sourcesFolderForPlatform(platformName, platformVer)));
            
        return platform;
    }

    
    public async getProjectInfo(loadPlugins?:boolean):Promise<CordovaProjectInfo>{
        let cordovaPlatforms:Array<CordovaPlatform> = [];
        let cordovaPlugins:Array<CordovaPlugin> = [];
        if (this._packageJson.cordova){
        cordovaPlatforms = this.getInstalledPlatforms();
          if(loadPlugins){
            cordovaPlugins = await this.getInstalledPlugins();
          }
        }
        return {
          name:this._packageJson.name,
          displayName:this._packageJson.displayName,
          description:this._packageJson.description,
          author:this._packageJson.author,
          license:this._packageJson.license,
          version:this._packageJson.version,
          path:this._projectPath,
          platforms:cordovaPlatforms,
          npmScripts:this._packageJson.scripts || [],
          plugins:cordovaPlugins,
          variants:[]
        };
    }

  /**
   * Returns a list of installed plugins for a Cordova Project
   */
  public getInstalledPlugins(): Promise<Array<CordovaPlugin>> {
    //Logger.consoleLog("getInstalledPlugins called...");
    var projectRoot = this._projectPath;
    return new Promise((resolve, reject) => {
      let that = this;
      let cordovaPluginScanner = new CordovaPluginScanner();
      cordovaPluginScanner.scan(projectRoot, (results:any)=> {
        let pluginsRaw = cordovaPluginScanner.getInstalledPlugin();
        let plugins = new Array();
        Object.keys(results.plugins).forEach((key) => {
          let pluginRaw = pluginsRaw.plugins[key];
          if (pluginRaw["plugin"] && pluginRaw["plugin"]["$"]){
            let plugin = new CordovaPlugin();
            plugin.name = key;
            plugin.id = pluginRaw["plugin"]["$"]["id"];
            plugin.version = pluginRaw["plugin"]["$"]["version"];
            plugin.description = (pluginRaw["plugin"]["description"] || ["n.a"])[0];
            plugin.isTopLevel = pluginRaw["is_top_level"];
            plugin.installed = true;
            plugin.info = pluginRaw;
            // gets extra info if availables
            if (pluginRaw["packageJson"]){
              if (pluginRaw["packageJson"]["author"]){
                if (pluginRaw["packageJson"]["author"] instanceof Object){
                  if (pluginRaw["packageJson"]["author"]){
                    plugin.author = pluginRaw["packageJson"]["author"]["name"];
                  }
                } else {
                  plugin.author = pluginRaw["packageJson"]["author"];
                }
              }
              if (pluginRaw["packageJson"]["license"]){
                plugin.license = pluginRaw["packageJson"]["license"];
              }
              if (pluginRaw["packageJson"]["repository"] && pluginRaw["packageJson"]["repository"]["url"]){
                plugin.repository = pluginRaw["packageJson"]["repository"]["url"];
              }
              if (pluginRaw["packageJson"]["repository"] && pluginRaw["packageJson"]["repository"]["type"]){
                plugin.repositoryType = pluginRaw["packageJson"]["type"];
              }
              if (pluginRaw["packageJson"]["homepage"]){
                plugin.homepage = pluginRaw["packageJson"]["homepage"];
              }
            }
            if (pluginRaw["source"] && pluginRaw["source"]["type"]){
              plugin.sourceType = pluginRaw["source"]["type"];
            }
            plugins.push(plugin);
          }
        });
        resolve(plugins);
      });
    });
  }

    
    public async addPlatform(platformName:string) {
        var prjInfo = await this.getProjectInfo(false);
        var cdvExecutor = new CordovaExecutor(this._projectPath);
        await cdvExecutor.addPlatform(prjInfo, platformName);
        this._packageJson = this.loadPackageJSON(this._projectPath);
    }

    public async removeAllPlatforms(){
        var prjInfo = await this.getProjectInfo(false);
        var cdvExecutor = new CordovaExecutor(this._projectPath);
        await cdvExecutor.removeAllPlatforms(prjInfo);
        this._packageJson = this.loadPackageJSON(this._projectPath);
    }

    public async removePlatform(platformName:string) {
        var prjInfo = await this.getProjectInfo(false);
        var cdvExecutor = new CordovaExecutor(this._projectPath);
        cdvExecutor.removePlatforms([platformName], this._projectPath);
        this._packageJson = this.loadPackageJSON(this._projectPath);
    }

    public async addPlugin(pluginInfo:CordovaPlugin){
        //TODO!!
    }

    public async removePlugin(pluginInfo:CordovaPlugin){
        //TODO!!
    }

    public setName(name:string, save?:boolean):void {
        this._packageJson.name = name;
        this.setDirty();
        if (save){
            this.save();
        }
    }

    public setDisplayName(displayName:string, save?:boolean):void {
        this._packageJson.displayName = displayName;
        this.setDirty();
        if (save){
            this.save();
        }
    }

    public setDescription(description:string, save?:boolean):void {
        this._packageJson.description = description;
        this.setDirty();
        if (save){
            this.save();
        }
    }

    public setAuthor(author:string, save?:boolean):void {
        this._packageJson.author = author;
        this.setDirty();
        if (save){
            this.save();
        }
    }

    public setLicense(license:string, save?:boolean):void {
        this._packageJson.license = license;
        this.setDirty();
        if (save){
            this.save();
        }
    }

    public setVersion(version:string, save?:boolean):void {
        this._packageJson.version = version;
        this.setDirty();
        if (save){
            this.save();
        }
    }

    public getVersion():string{
        return this._packageJson.version;
    }

    public save():void{
        this.storePackageJson(this._packageJson);
        this.setDirty(false);
    }

    private loadPackageJSON(filePath:string):Object {
        var file = path.join(filePath, 'package.json')
        return jsonfile.readFileSync(file);
    }

    private toAbsolutePath(relativePath:string):string {
        return path.join(this._projectPath, relativePath);
    }
    
    private setDirty(dirty?:boolean){
        this._isDirty = dirty ? dirty : true;
    }

    public isDirty():boolean{
        return this._isDirty;
    }

    private assetsFolderForPlatform(platformName:string, platformVersion:string):string {
        if (platformName==='ios'){
            return "www";
        } else if (platformName==='android'){
            return path.join(this.getAndroidSourcePath(platformVersion), 'assets', 'www');
        } else {
            return "www";
        }
    }
    
    private sourcesFolderForPlatform(platformName:string, platformVersion:string):string {
        if (platformName==='ios'){
            return "./";
        } else if (platformName==='android'){
            return this.getAndroidSourcePath(platformVersion);
        } else {
            return "./";
        }
    }
    
    private getAndroidSourcePath(platformVersion:string):string {
        let versionParts = platformVersion.split("\.");
    
        if (versionParts && versionParts[0] && parseInt(versionParts[0]) >= 7) {
            return path.join('app', 'src', 'main');
        } else {
            return path.join('.');
        }
    }
    
    private storePackageJson(packageJson:Object):void {
        let jsonPath = path.join(this._projectPath, "package.json");
        fs.writeFileSync(jsonPath, JSON.stringify(packageJson, null, "\t"), 'utf8')
    }
    
}
