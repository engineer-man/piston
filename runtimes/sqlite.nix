{pkgs, piston, ...}:
let
    pkg = pkgs.sqlite;
in piston.mkRuntime {
    language = "sqlite";
    version = pkg.version;

    aliases = [
        "sql"
    ];
    
    run = ''
    ${pkg}/bin/sqlite3 < "$1"
    '';

    tests = [
        (piston.mkTest {
            files = {
                "test.sql" = ''
                    SELECT 'OK';
                '';
            };
            args = [];
            stdin = "";
            packages = [];
            main = "test.sql";
        })
    ];
}