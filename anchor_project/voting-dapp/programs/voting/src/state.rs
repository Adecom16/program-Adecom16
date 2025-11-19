use anchor_lang::prelude::*;

#[account]
pub struct Poll {
    pub poll_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub options: Vec<String>,
    pub votes: Vec<u64>,
    pub start_time: i64,
    pub end_time: i64,
    pub is_active: bool,
    pub total_votes: u64,
    pub bump: u8,
}

impl Poll {
    pub const MAX_TITLE_LENGTH: usize = 100;
    pub const MAX_DESCRIPTION_LENGTH: usize = 500;
    pub const MAX_OPTION_LENGTH: usize = 50;
    pub const MAX_OPTIONS: usize = 10;

    pub fn space(num_options: usize) -> usize {
        8 + // discriminator
        8 + // poll_id
        32 + // creator
        4 + Self::MAX_TITLE_LENGTH + // title
        4 + Self::MAX_DESCRIPTION_LENGTH + // description
        4 + (num_options * (4 + Self::MAX_OPTION_LENGTH)) + // options
        4 + (num_options * 8) + // votes
        8 + // start_time
        8 + // end_time
        1 + // is_active
        8 + // total_votes
        1   // bump
    }
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub poll_id: u64,
    pub option_index: u8,
    pub timestamp: i64,
    pub bump: u8,
}

impl VoteRecord {
    pub const SPACE: usize = 8 + // discriminator
        32 + // voter
        8 +  // poll_id
        1 +  // option_index
        8 +  // timestamp
        1;   // bump
}

#[account]
pub struct PollCounter {
    pub count: u64,
    pub bump: u8,
}

impl PollCounter {
    pub const SPACE: usize = 8 + 8 + 1;
}