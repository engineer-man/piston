CC = gcc 
CFLAGS = -O2 -Wall -lseccomp 
TARGET = nosocket 
BUILD_PATH = ./
INSTALL_PATH = /usr/local/bin/
SOURCE = nosocket.c

all: $(TARGET)

$(TARGET): $(SOURCE)
	$(CC) $(BUILD_PATH)$(SOURCE) $(CFLAGS) -o $(TARGET)

install:
	mv $(TARGET) $(INSTALL_PATH)

clean:
	$(RM) $(TARGET)
	$(RM) $(INSTALL_PATH)$(TARGET) 

