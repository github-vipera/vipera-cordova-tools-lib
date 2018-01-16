'use babel'

/*!
 * Dynamic Engine Workbench
 * Copyright(c) 2017 Dynamic Engine Team @ Vipera Plc
 * MIT Licensed
 */

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const kill = require('tree-kill');
const fse = require('fs-extra');
import { Logger } from './Logger'
 

export class CommandExecutor {

  protected isWin: boolean;
  protected basePath: string;
  protected spawnRef: any;

  constructor(path: string) {
    Logger.getInstance().debug("Creating CommandExecutor...");
    this.basePath = path;// != undefined ? path : atom.project["getPaths"]()[0];
    this.isWin = /^win/.test(process.platform);
  }

  prepareCommand(cmd: string) {
    if (this.isWin) {
      cmd = cmd + ".cmd";
    }
    return cmd;
  }

  getCmdOptions(path?:string,env?:any):any{
    let cmdOptions:any = {
        cwd: path || this.basePath,
        detached:false
    };
    if(env){
      cmdOptions.env = env;
    }
    return cmdOptions;
  }

  isBusy(): boolean {
    return this.spawnRef != undefined;
  }

  stopSpawn() {
    Logger.getInstance().debug("stop run Spawn")
    if (!this.spawnRef) {
      return;
    }
    kill(this.spawnRef.pid);
  }

  runExec(cmd: string): Promise<any> {
    Logger.getInstance().debug("execOperationWithExec cmd:", cmd);
    return new Promise((resolve, reject) => {
      let options = this.getCmdOptions();
      exec(cmd, options, (error:any, stdout:any, stderr:any) => {
        if (error) {
          Logger.getInstance().debug("execOperationWithExec error: ", error);
          reject(error);
          return;
        }
        Logger.getInstance().debug("exec prepare done");
        resolve(stdout);
      });
    });
  }

  runSpawn(command:string, args:any, operationLogTag:any, withResult:any):Promise<any> {
    //Logger.getInstance().info("execOperationWithSpawn args:", args);
    //var cmd = "cordova";
    var options = {
      cwd: this.basePath,
      detached: false
    };
    let cmd = this.prepareCommand(command);
    this.spawnRef = spawn(cmd, args, options);
    return new Promise((resolve, reject) => {
      var operationResult:any = undefined;
      this.spawnRef.stdout.on('data', (data:any) => {
        if (withResult && data && data.toString() != "\n") {
          operationResult = data.toString();
        }
        Logger.getInstance().debug(`[${operationLogTag} progress]: ${data}`)
        //Logger.consoleLog(`[${operationLogTag} progress]: ${data}`);
      });

      this.spawnRef.stderr.on('data', (data:any) => {
        Logger.getInstance().debug(`[${operationLogTag}]: ${data}`);
      });

      this.spawnRef.on('close', (code:any) => {
        //Logger.consoleLog(`[${operationLogTag}] child process exited with code ${code}`);
        Logger.getInstance().debug(`[${operationLogTag}] child process exited with code ${code}`)
        this.spawnRef = undefined;
        if (code === 0) {
          resolve({
            "msg": `${operationLogTag} DONE`,
            "operationResult": operationResult
          });
        } else {
          reject(`${operationLogTag} FAIL`);
        }
      });
    });
  }



}
