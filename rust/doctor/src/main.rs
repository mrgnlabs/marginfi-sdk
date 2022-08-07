mod doctor;

use doctor::DoctorConfig;

use crate::doctor::Doctor;

fn main() {
    env_logger::init();

    let mut doctor = Doctor::new(DoctorConfig::from_env());
    doctor.run();
}
