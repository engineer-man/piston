package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os/exec"
	"strings"
	"time"
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
	var found = false
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

	// check if the supplied language is supported
	// now calls function and returns
	for _, lang := range whitelist {
		if lang == inbound.Language {
			launch(inbound, res)
			return
		}
	}

	// now only called when the language is not supported
	if !found {
		problem := problem{
			Code: "unsupported_language",
			Message: inbound.Language + " is not supported by Piston",
		}

		pres, _ := json.Marshal(problem)

		res.Write(pres)
		return
	}
}

func launch(inbound2 inbound, res http.ResponseWriter){
	// write the code to temp dir
	filename := fmt.Sprintf("/tmp/%d.code", time.Now().UnixNano())

	ioutil.WriteFile(filename, []byte(inbound2.Source), 0644)

	// set up the execution
	cmd := exec.Command("../docker/execute", inbound2.Language, filename)

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