use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        title: String,
        description: String,
        options: Vec<String>,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        instructions::initialize_poll::handler(ctx, title, description, options, start_time, end_time)
    }

    pub fn vote(
        ctx: Context<Vote>,
        poll_id: u64,
        option_index: u8,
    ) -> Result<()> {
        instructions::vote::handler(ctx, poll_id, option_index)
    }

    pub fn close_poll(
        ctx: Context<ClosePoll>,
        poll_id: u64,
    ) -> Result<()> {
        instructions::close_poll::handler(ctx, poll_id)
    }
}