for i in test/input/*; do
    go run genReport.go "$i"
done