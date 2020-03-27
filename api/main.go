package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "os"
    "os/exec"
    "regexp"
    "strings"
    "time"
)

type inbound struct {
    Language string   `json:"language"`
    Source   string   `json:"source"`
    Args     []string `json:"args"`
}

type problem struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

type outbound struct {
    Ran    bool   `json:"ran"`
    Output string `json:"output"`
}

type Language struct {
    Name    string `json:"name,omitempty"`
    Version string `json:"version,omitempty"`
}

var instance int
var versionRegex = regexp.MustCompile("([0-9]+\\.[0-9]+\\.[0-9]+)")
var javaRegex = regexp.MustCompile("([0-9]+)")

func main() {
    port := "2000"

    updateVersions()

    fmt.Println("starting api on port", port)
    http.HandleFunc("/execute", Execute)
    http.HandleFunc("/versions", versions)
    http.ListenAndServe(":"+port, nil)
}

func Execute(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json")

    // get json
    inbound := inbound{}
    message := json.NewDecoder(req.Body)
    message.Decode(&inbound)

    whitelist := []string{
        "c",
        "cpp", "c++",
        "c#", "csharp", "cs",
        "go",
        "java",
        "nasm", "asm",
        "javascript", "js", "node",
        "typescript", "ts",
        "php",
        "python", "python2", "python3",
        "ruby",
        "swift",
        "rust",
        "bash",
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
    problem := problem{
        Code:    "unsupported_language",
        Message: inbound.Language + " is not supported by Piston",
    }

    pres, _ := json.Marshal(problem)

    res.Write(pres)
}

func launch(request inbound, res http.ResponseWriter) {
    stamp := time.Now().UnixNano()

    // write the code to temp dir
    srcfile := fmt.Sprintf("/tmp/%d.code", stamp)

    ioutil.WriteFile(srcfile, []byte(request.Source), 0644)

    // set up the arguments to send to the execute command
    var args []string

    args = append(args, request.Language)
    args = append(args, srcfile)

    args = append(args, strings.Join(request.Args, "\n"))

    // set up the execution
    cmd := exec.Command("../lxc/execute", args...)

    // capture out/err
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr

    err := cmd.Run()

    // prepare response
    outbound := outbound{
        Ran:    err == nil,
        Output: strings.TrimSpace(stdout.String()),
    }

    response, _ := json.Marshal(outbound)

    res.Write(response)
}

func updateVersions() {
    f, err := os.Create("versions.json")
    if err != nil {
        log.Println(err)
        return
    }
    defer f.Close()
    langs, err := getVersions()
    if err != nil {
        log.Println(err)
        return
    }
    res, err := json.Marshal(langs)
    if err != nil {
        log.Println(err)
        return
    }
    f.Write(res)
}

// get all the language and their current version
func getVersions() ([]Language, error) {
    var languages []Language
    res, err := execVersionScript()
    if err != nil {
        return nil, err
    }
    languageInfo := strings.Split(res, "---")
    for _, v := range languageInfo {
        if len(v) < 2 {
            continue
        }
        name, version := getVersion(v)
        languages = append(languages, Language{
            Name:    name,
            Version: version,
        })
    }
    return languages, nil
}

// run the script that retrieves all the language versions
func execVersionScript() (string, error) {
    fmt.Println("running script")
    output := bytes.Buffer{}
    cmd := exec.Command("../lcx/versions")
    cmd.Stdout = &output
    err := cmd.Run()
    return strings.ToLower(output.String()), err
}

// return the language and its version
// most of the time it is easy to get the name and version
// but for some languages helper functions are used

func getVersion(s string) (string, string) {
    lines := strings.Split(s, "\n")
    if lines[1] == "java" {
        return "java", javaRegex.FindString(lines[2])
    }
    return lines[1], versionRegex.FindString(s)
}
