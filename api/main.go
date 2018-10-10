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
	"strings"
	"strconv"
	"time"
)

type inbound struct {
	Language string    `json:"language"`
	Source   string    `json:"source"`
	Args     []string  `json:"args"`
}

type problem struct {
	Code    string  `json:"code"`
	Message string  `json:"message"`
}

type outbound struct {
	Generator string  `json:"instance"`
	Ran       bool    `json:"ran"`
	Output    string  `json:"output"`
}

var instance int

func main() {
	port := 2000

	if len(os.Args) > 1 {
		if i, err := strconv.Atoi(os.Args[1]); err == nil {
			instance = i
			port += i
		}
	} else {
		instance = 0
	}

	fmt.Println("starting api on port", port)

	http.HandleFunc("/execute", Execute)
	err := http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", port), nil); if err != nil{
		log.Fatal(err)
	}
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
		"php",
		"python", "python2", "python3",
		"r",
		"ruby",
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
		Code: "unsupported_language",
		Message: inbound.Language + " is not supported by Piston",
	}

	pres, err := json.Marshal(problem); if err != nil{
		log.Fatal(err)
	}

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
	cmd := exec.Command("../docker/execute", args...)
	cmd.Env = os.Environ()

	if instance > 0 {
		cmd.Env = append(cmd.Env, fmt.Sprintf("SOCKET=unix:///var/run/docker-%d.sock", instance))
	}

	// capture out/err
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run(); if err != nil{
		log.Fatal(err)
	}

	// prepare response
	outbound := outbound{
		Generator: fmt.Sprintf("docker-%d", instance),
		Ran: err == nil,
		Output: strings.TrimSpace(stdout.String()),
	}

	response, err:= json.Marshal(outbound); if err != nil{
		log.Fatal(err)
	}

	res.Write(response)
}