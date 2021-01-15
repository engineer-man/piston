package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "os/exec"
    "regexp"
    "strings"
    "time"
)

type Inbound struct {
    Language string   `json:"language"`
    Source   string   `json:"source"`
    Args     []string `json:"args"`
}

type Problem struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

type Outbound struct {
    Ran      bool   `json:"ran"`
    Language string `json:"language"`
    Version  string `json:"version"`
    Output   string `json:"output"`
    Stdout   string `json:"stdout"`
    Stderr   string `json:"stderr"`
}

type Language struct {
    Name    string `json:"name,omitempty"`
    Version string `json:"version,omitempty"`
}

var instance int
var languages []Language

func main() {
    port := "2000"

    var err error
    languages, err = UpdateVersions()

    if err != nil {
        fmt.Println("could not get version info and therefore couldn't start")
        fmt.Println(err)
        return
    }

    fmt.Println("starting api on port", port)
    http.HandleFunc("/execute", Execute)
    http.HandleFunc("/versions", Versions)
    http.ListenAndServe(":"+port, nil)
}

func Execute(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json")

    // get json
    inbound := Inbound{}
    message := json.NewDecoder(req.Body)
    message.Decode(&inbound)

    whitelist := []string{
        "awk",
        "bash",
        "brainfuck", "bf",
        "c",
        "cpp", "c++",
        "csharp", "cs", "c#",
        "deno", "denojs", "denots",
        "elixir", "exs",
        "emacs", "elisp", "el",
        "go",
        "haskell", "hs",
        "java",
        "jelly",
        "julia", "jl",
        "kotlin",
        "lua",
        "nasm", "asm",
        "nasm64", "asm64",
        "node", "javascript", "js",
        "perl", "pl",
        "php",
        "python2",
        "python3", "python",
        "paradoc",
        "ruby",
        "rust",
        "swift",
        "typescript", "ts",
    }

    // check if the supplied language is supported
    // now calls function and returns
    for _, lang := range whitelist {
        if lang == inbound.Language {
            launch(inbound, res)
            return
        }
    }

    // now only called when the language is not supported
    problem := Problem{
        Code:    "unsupported_language",
        Message: inbound.Language + " is not supported by Piston",
    }

    pres, _ := json.Marshal(problem)

    res.WriteHeader(http.StatusBadRequest)
    res.Write(pres)
}

func Versions(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json")

    data, _ := json.Marshal(languages)

    res.Write(data)
}

type StdWriter struct {
    combined *string
    separate *string
}

func (writer *StdWriter) Write(data []byte) (int, error) {
    *writer.combined += string(data)
    *writer.separate += string(data)

    return len(data), nil
}

func launch(request Inbound, res http.ResponseWriter) {
    stamp := time.Now().UnixNano()

    // write the code to temp dir
    srcfile := fmt.Sprintf("/tmp/%d.code", stamp)

    ioutil.WriteFile(srcfile, []byte(request.Source), 0644)

    // set up the arguments to send to the execute command
    cmd := exec.Command("../lxc/execute", request.Language, srcfile, strings.Join(request.Args, "\n"))

    // capture out/err
    var stdout, stderr, combined string

    cmd.Stdout = &StdWriter{
        combined: &combined,
        separate: &stdout,
    }

    cmd.Stderr = &StdWriter{
        combined: &combined,
        separate: &stderr,
    }

    err := cmd.Run()

    stdout = strings.TrimSpace(stdout)
    stderr = strings.TrimSpace(stderr)
    combined = strings.TrimSpace(combined)

    if len(stdout) > 65536 {
        stdout = stdout[:65536]
    }

    if len(stderr) > 65536 {
        stderr = stdout[:65536]
    }

    if len(combined) > 65536 {
        combined = combined[:65536]
    }

    // get the executing version of the language
    execlang := request.Language

    switch execlang {
    case "bf":
        execlang = "brainfuck"
    case "c++":
        execlang = "cpp"
    case "cs", "c#":
        execlang = "csharp"
    case "denojs", "denots":
        execlang = "deno"
    case "el", "elisp":
        execlang = "emacs"
    case "exs":
        execlang = "elixir"
    case "hs":
        execlang = "haskell"
    case "asm":
        execlang = "nasm"
    case "asm64":
        execlang = "nasm64"
    case "js", "javascript":
        execlang = "node"
    case "jl":
        execlang = "julia"
    case "python":
        execlang = "python3"
    case "ts":
        execlang = "typescript"
    }

    // prepare response
    outbound := Outbound{
        Ran:      err == nil,
        Language: request.Language,
        Version:  "",
        Output:   combined,
        Stdout:   stdout,
        Stderr:   stderr,
    }

    // retrieve the language version
    for _, lang := range languages {
        if lang.Name == execlang {
            outbound.Version = lang.Version
            break
        }
    }

    response, _ := json.Marshal(outbound)

    res.Write(response)
}

func UpdateVersions() ([]Language, error) {
    langs, err := GetVersions()

    if err != nil {
        return nil, err
    }

    return langs, nil
}

// get all the language and their current version
func GetVersions() ([]Language, error) {
    var languages []Language

    res, err := ExecVersionScript()

    if err != nil {
        return nil, err
    }

    info := strings.Split(res, "---")

    for _, v := range info {
        if len(v) < 2 {
            continue
        }
        name, version := GetVersion(v)
        languages = append(languages, Language{
            Name:    name,
            Version: version,
        })
    }

    return languages, nil
}

// run the script that retrieves all the language versions
func ExecVersionScript() (string, error) {
    cmd := exec.Command("../lxc/versions")

    var stdout bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stdout

    err := cmd.Run()

    return strings.ToLower(stdout.String()), err
}

// return the language and its version
// most of the time it is easy to get the name and version
// but for some languages helper functions are used
func GetVersion(s string) (string, string) {
    lines := strings.Split(s, "\n")

    if lines[1] == "java" {
        return "java", regexp.MustCompile("([0-9]+)").FindString(lines[2])
    }

    if lines[1] == "emacs" {
        return "emacs", regexp.MustCompile("([0-9]+\\.[0-9]+)").FindString(lines[2])
    }

    return lines[1], regexp.MustCompile("([0-9]+\\.[0-9]+\\.[0-9]+)").FindString(s)
}
