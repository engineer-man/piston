{pkgs, piston, ...}:
let
    pkg = pkgs.octave; 
in piston.mkRuntime {
    language = "octave";
    version = pkg.version;

    aliases = [
        "matlab"
        "m"
    ];

    run = ''
        ${pkg}/bin/octave --no-gui --no-window-system --no-history --no-init-file --no-site-file --norc --quiet "$@"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.m" = ''
                    disp("OK");
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.m";
        })
    ];
}