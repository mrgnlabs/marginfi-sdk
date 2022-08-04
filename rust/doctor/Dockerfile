FROM rust:1.61-slim

RUN apt-get update -y 
RUN apt-get upgrade -y 
RUN apt-get install -y pkg-config build-essential libudev-dev clang cmake
RUN rustup component add rustfmt clippy
RUN rustup install nightly

WORKDIR /app

COPY ./programs/marginfi ./programs/marginfi
COPY ./zo-margin-utils ./zo-margin-utils
COPY ./sdk/rust/doctor ./sdk/rust/doctor

WORKDIR /app/sdk/rust/doctor

RUN cargo +nightly build --release --features sentry-reporting

RUN rm -rf /app/programs
RUN rm -rf /app/zo-margin-utils

CMD ["./target/release/doctor"]