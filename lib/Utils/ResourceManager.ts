'use babel'

/*!
 * Dynamic Engine Workbench
 * Copyright(c) 2017 Dynamic Engine Team @ Vipera Plc
 * MIT Licensed
 */

const fs = require('fs')
const path = require("path")
const requireText = require('require-text');

export class ResourceManager {

  private static getInternalResourcePath(resourceName:string):string{
    return path.join("../../resources/" , resourceName);
  }

  public static getResourceContent(resourceName:string):string{
    var resPath = ResourceManager.getInternalResourcePath(resourceName);
    return requireText(resPath, require);
  }

  public static getJSONResource(resourceName:string):Object{
    return JSON.parse(ResourceManager.getResourceContent(resourceName));
  }

  public static getResourcePath(resourceName:string):string{
    let relativePath = ResourceManager.getInternalResourcePath(resourceName);
    return require.resolve(relativePath).toString();
  }

}
