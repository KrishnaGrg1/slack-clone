
build:
	go build -o thread_call ./cmd

run: build
	./thread_call