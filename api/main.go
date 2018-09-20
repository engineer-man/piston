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

type script struct {
    Language string  `json:"language"`
    Source   string  `json:"source"`
}

type result struct {
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
    script := script{}
    message := json.NewDecoder(req.Body)
    message.Decode(&script)

    // write the code to temp dir
    filename := fmt.Sprintf("/tmp/%d.code", time.Now().UnixNano())

    ioutil.WriteFile(filename, []byte(script.Source), 0644)

    // set up the execution
    cmd := exec.Command("../docker/execute", script.Language, filename)

    // capture out/err
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr

    err := cmd.Run()

    // prepare response
    data := result{
        Ran: err == nil,
        Output: strings.TrimSpace(stdout.String()),
    }

    response, _ := json.Marshal(data)

    res.Write(response)
}
