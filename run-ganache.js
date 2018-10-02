var mnemonic = require('./local-mnemonic.json').mnemonic;
var spawn = require('child_process').spawn;

var ganache = spawn('node_modules/.bin/ganache-cli', ['-m', mnemonic], {
    cwd: process.cwd(),
    detached: false,
    stdio: "inherit"
});
ganache.on('error', function(err) {
  console.error(err);
  process.exit(1);
});

setTimeout(function () {
    var deploy = spawn('npm', ['run', 'deploy-contracts'], {
        stdio: "inherit"
    });
    deploy.on('error', function(err) {
      console.error(err);
      process.exit(1);
    });
}, 7000);