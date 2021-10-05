{pkgs, piston}:
piston.mkRuntime {
    language = "javascript";
    version = pkgs.nodejs.version;
    runtime = "node";

    aliases = [
        "node-js"
        "node-javascript"
        "js"
    ];

    run = ''
    ${pkgs.nodejs}/bin/node "$@"
    '';

}