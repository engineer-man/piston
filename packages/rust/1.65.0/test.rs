fn main() {
    println!("OK");

    // 1.65.0 feature
    let _test = if let Some(t) = Some(1234) {
        t
    } else { unreachable!() };
}
