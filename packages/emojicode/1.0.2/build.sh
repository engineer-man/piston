curl -L https://github.com/emojicode/emojicode/releases/download/v1.0-beta.2/Emojicode-1.0-beta.2-Linux-x86_64.tar.gz -o emoji.tar.gz
tar xzf emoji.tar.gz

mv Emojicode-1.0-beta.2-Linux-x86_64 emoji

rm emoji.tar.gz

cd emoji

./install.sh


chmod +x emojicodec

cd ..
