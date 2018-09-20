package main

import (
    "bytes"
    "fmt"
    "time"
    "encoding/json"
    "net/http"
    "io/ioutil"
    "os/exec"
    "strings"
)

type inbound struct {
    Language string  `json:"language"`
    Source   string  `json:"source"`
}

type problem struct {
    Code    string  `json:"code"`
    Message string  `json:"message"`
}

type outbound struct {
    Ran    bool    `json:"ran"`
    Output string  `json:"output"`
}

func main() {
    http.HandleFunc("/execute", Execute)

    http.ListenAndServe("0.0.0.0:1337", nil)
}

func Execute(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json")

    // get json
    inbound := inbound{}
    message := json.NewDecoder(req.Body)
    message.Decode(&inbound)

    whitelist := []string{
        "python2",
        "python",
        "python3",
        "ruby",
        "javascript",
        "js",
        "node",
    }

    found := false

    // check if the supplied language is supported
    for _, lang := range whitelist {
        if lang == inbound.Language {
            found = true
            break
        }
    }

    // send an error if it isn't
    if !found {
        problem := problem{
            Code: "unsupported_language",
            Message: inbound.Language + " is not supported by Piston",
        }

        pres, _ := json.Marshal(problem)

        res.Write(pres)
        return
    }

    // write the code to temp dir
    filename := fmt.Sprintf("/tmp/%d.code", time.Now().UnixNano())

    ioutil.WriteFile(filename, []byte(inbound.Source), 0644)

    // set up the execution
    cmd := exec.Command("../docker/execute", inbound.Language, filename)

    // capture out/err
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr

    err := cmd.Run()

    // prepare response
    outbound := outbound{
        Ran: err == nil,
        Output: strings.TrimSpace(stdout.String()),
    }

    response, _ := json.Marshal(outbound)

    res.Write(response)
}
