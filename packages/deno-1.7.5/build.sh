mkdir -p output build

cd build
curl -L https://github.com/denoland/deno/releases/download/v1.7.5/deno-x86_64-unknown-linux-gnu.zip --output deno.zip
unzip deno.zip

cd ..

mv build/deno output

chmod +x output/deno