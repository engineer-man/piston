#!/usr/bin/env bash

AUTH_HEADER="Authorization: $API_KEY"

for test_file in */*/test.*
do
	IFS='/' read -ra test_parts <<< "$test_file"
	IFS='.' read -ra file_parts <<< "$(basename $test_file)"
	language=${file_parts[1]}
	lang_ver=${test_parts[1]}

	test_src=$(python3 -c "import json; print(json.dumps(open('$test_file').read()))")

	json='{"language":"'$language'","version":"'$lang_ver'","files":[{"content":'$test_src'}]}'
	
	result=$(curl -s -XPOST -H "Content-Type: application/json" -d "$json" https://emkc.org/api/v2/piston/execute -H $AUTH_HEADER)

	echo "==$test_file: $language-$lang_ver=="
	#jq '.'  <<<"$result"
	jq -r 'if (.run.stdout | contains("OK") ) then (.run.stdout) else (.compile.output + .run.output) end' <<<$result
done
