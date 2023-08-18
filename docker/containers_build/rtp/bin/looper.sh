#!/bin/bash
let i=0
while true; do
	let i++
	echo -ne "$i"'\r'; sleep 1;
done
