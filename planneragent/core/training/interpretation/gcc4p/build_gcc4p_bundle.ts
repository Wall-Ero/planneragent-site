import{prepareGcc4pBundle}from"./prepare_gcc4p_bundle";
prepareGcc4pBundle().then(result=>process.stdout.write(JSON.stringify({...result,entry_names:undefined},null,2)+"\n")).catch(error=>{process.stderr.write(`${error instanceof Error?error.stack:error}\n`);process.exitCode=1});
