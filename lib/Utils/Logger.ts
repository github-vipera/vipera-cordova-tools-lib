'use babel'

/*!
 * Dynamic Engine Workbench
 * Copyright(c) 2017 Dynamic Engine Team @ Vipera Plc
 * MIT Licensed
 */

var winston = require('winston');

export class Logger {

  private static instance: Logger;

  private constructor(){
  }

  static getInstance():Logger {
      if (!Logger.instance) {
          Logger.instance = new Logger();
      }
      return Logger.instance;
  }

  public info(...msg:any[]):void{
    winston.log("info", msg);
  }

  public debug(...msg:any[]):void{
    winston.log("debug", msg);
  }

  public warn(...msg:any[]):void{
    winston.log("warn", msg);
  }

  public error(...msg:any[]):void{
    winston.log("error", msg);
  }

}

