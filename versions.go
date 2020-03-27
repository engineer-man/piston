package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strings"
)

type Language struct {
	Name    string `json:"name,omitempty"`
	Version string `json:"version,omitempty"`
}

type Languages struct {
	Languages []Language `json:"languages"`
}

var versionRegex = regexp.MustCompile("([0-9]+\\.[0-9]+\\.[0-9]+)")

func updateVersions(){
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
	return lines[1], versionRegex.FindString(lines[2])
}
