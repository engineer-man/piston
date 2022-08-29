fn main() {
    println!("OK");

    // 1.63.0 features
    use std::sync::Mutex;
    const _M: Mutex<()> = Mutex::new(());
}
