package main

import (
	"fmt"
	"io/ioutil"
	"os"
	// "time"
	"bytes"
	"path/filepath"
	// "strings"
)

func reportFileName(filename string) string {
	_, fname := filepath.Split(filename)
	return fmt.Sprintf("report_%s.html", fname)
}

func main() {
	templatefile := "template.html"
	csvpath := os.Args[1]
	_, csvfile := filepath.Split(csvpath)

	template, err := ioutil.ReadFile(templatefile)
	if err != nil {
		panic(err)
	}
	csv, err := ioutil.ReadFile(csvpath)
	if err != nil {
		panic(err)
	}
	version, err := ioutil.ReadFile("version")
	if err != nil {
		panic(err)
	}

	// fmt.Print(string(template)[:10])
	// fmt.Print(string(csv[:10]))

	report := template
	report = bytes.Replace(report, []byte("{csv_here}"), csv, 1)
	report = bytes.Replace(report, []byte("{filename_here}"), []byte(csvfile), 1)
	report = bytes.Replace(report, []byte("{version_here}"), version, 1)

	// fmt.Print(string(report))
	// fmt.Print(reportFileName(csvfile))

	ioutil.WriteFile(reportFileName(csvfile), report, 0644)

	// time.Sleep(10000)
}
