NAME=python
VERSION=3.9.1
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPS=
BINARY_FILES=

include ../../Makefile

bin: 

Python-${VERSION}.tgz: 
	curl "https://www.python.org/ftp/python/${VERSION}/Python-${VERSION}.tgz" -O $@

%: %.tgz
	tar xzvf $@


