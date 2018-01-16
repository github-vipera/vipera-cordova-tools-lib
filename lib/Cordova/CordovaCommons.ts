
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
  
  export interface NewProjectInfo {
    name:string;
    packageId:string;
    basePath:string;
    path:string;
    platforms:Array<string>,
    type:string;
    template:string;
  }
  
  
  