mod doctor;

use doctor::DoctorConfig;

use crate::doctor::Doctor;

fn main() {
    let mut doctor = Doctor::new(DoctorConfig::from_env());
    doctor.run();
}
