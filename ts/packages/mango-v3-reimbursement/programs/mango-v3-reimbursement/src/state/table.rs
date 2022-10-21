use std::mem::size_of;

use anchor_lang::{__private::bytemuck, prelude::*};
use static_assertions::const_assert_eq;

pub const ROW_HEADER_SIZE: usize = 40;

#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
#[repr(C)]
pub struct Row {
    pub owner: Pubkey,
    pub balances: [u64; 16],
}
const_assert_eq!(size_of::<Row>(), 32 + 8 * 16);
const_assert_eq!(size_of::<Row>() % 8, 0);

unsafe impl bytemuck::Pod for Row {}
unsafe impl bytemuck::Zeroable for Row {}

impl Row {
    pub fn load<'a>(table_ai_data: &'a [u8], index_into_table: usize) -> Result<&'a Self> {
        require_eq!(
            (table_ai_data.len() - ROW_HEADER_SIZE) % size_of::<Row>(),
            0
        );
        let start = ROW_HEADER_SIZE + index_into_table * size_of::<Row>();
        let end = start + size_of::<Row>();
        Ok(bytemuck::from_bytes::<Row>(&table_ai_data[start..end]))
    }

    pub fn get_num_of_rows<'a>(table_ai_data: &'a [u8]) -> Result<usize> {
        require_eq!(
            (table_ai_data.len() - ROW_HEADER_SIZE) % size_of::<Row>(),
            0
        );
        Ok((table_ai_data.len() - ROW_HEADER_SIZE) / size_of::<Row>())
    }
}
