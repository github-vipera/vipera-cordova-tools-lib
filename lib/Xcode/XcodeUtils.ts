'use babel'

import { Logger } from '../Utils/Logger'

const path = require('path');
const fs = require('fs-extra')
const sync = require('child_process').spawnSync;
const _ = require("lodash");
const xml2js = require('xml2js');
const provisioning = require('provisioning');

/*
var Q = require("q");
const git = require('simple-git/promise');
*/

export enum XcodeProjectVersionType {
    MarketingVersion = 'what-marketing-version',
    Default = 'what-version'
};

export class XcodeUtils {
    
    private constructor(){
    }

    public static getProjectVersion(projectPath:string, versionType:XcodeProjectVersionType):string {
        XcodeUtils.pathExists(projectPath);
        
        const agvtoolOpts = {
            cwd: path
        };
        var agvTest = sync('agvtool', [versionType, '-terse'], agvtoolOpts);
        if (agvTest.error){
            throw agvTest.error;
        } else {
            if (agvTest.status==0){
                var ret = agvTest.stdout.toString();
                return (_.replace(ret, '\n', ''));
            } else {
                throw  agvTest.stdout.toString();
            }
        }

    }

    public static loadProvisioningProfiles():Promise<any>{

        return new Promise((resolve, reject)=>{
          Logger.getInstance().debug("Loading iOS Provisioning Profiles...")
          let provisioningProfiles:any = {};
    
          let provisioningProfileFolder = XcodeUtils.getProvisionigProfilesFolder();// path.join(homeFolder, "Library", "MobileDevice" , "Provisioning Profiles");
          Logger.getInstance().debug("iOS Provisioning Profiles folder: " + provisioningProfileFolder)
    
            var provisioningFileNames = fs.readdirSync(provisioningProfileFolder);
            let totalFilesToProcess = provisioningFileNames.length;
            Logger.getInstance().debug("Found "+ totalFilesToProcess +" profiles found.");
            for (var i=0;i<provisioningFileNames.length;i++){
              var filename = path.join(provisioningProfileFolder,provisioningFileNames[i]);
              //Logger.getInstance().debug('Loading provisioning profile '+ filename +'...');
              //Logger.getInstance().debug("Loading profile for "+ filename +"...");
              provisioning(filename, function(error:any, data:any){
                if (error){
                  //Logger.getInstance().debug('Error loading provisioning profile: '+ error);
                }
                else if (data){
                  var appIdentifier = data.Entitlements['application-identifier'];
                  var teamIdentifier = data.TeamIdentifier;
                  var teamName = data.TeamName;
                  var applicationIdentifierPrefix = data.ApplicationIdentifierPrefix;
                  var appId = appIdentifier.substring(applicationIdentifierPrefix[0].length + 1, appIdentifier.length);
                  provisioningProfiles[appIdentifier] = {
                    "appId" : appId,
                    "appIdentifier" : appIdentifier,
                    "teamIdentifier" : teamIdentifier,
                    "teamName" : teamName,
                    "data" : data
                  };
                  //Logger.getInstance().debug("Loaded profile for " + appIdentifier)
                } else {
    
                }
                totalFilesToProcess--;
                if (totalFilesToProcess==0){
                  Logger.getInstance().debug("Profiles loaded.")
                  resolve(provisioningProfiles);
                }
              });
            }
        })
      }
    
      public static getProvisionigProfilesFolder():string {
        let homeFolder = process.env['HOME'];
        let provisioningProfileFolder = path.join(homeFolder, "Library", "MobileDevice" , "Provisioning Profiles");
        return provisioningProfileFolder;
      }

      
    private static pathExists(pathStr:string):boolean {
        if (!fs.existsSync(pathStr)){
                throw "Invalid path "+ pathStr+".";
        }
        return true;
    }

}
