curl -L https://ftp.gnu.org/gnu/gforth/gforth-0.7.3.tar.gz -o forth.tar.gz
tar xzf forth.tar.gz
rm forth.tar.gz

cd gforth-0.7.3/
./BUILD-FROM-SCRATCH --host=x86_64 --build=x86_64  

make
make install

chmod +x ./gforth
cd ..
