use anchor_lang::prelude::*;
use crate::state::{Poll, VoteRecord};
use crate::errors::VotingError;

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct Vote<'info> {
    #[account(
        mut,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(
        init,
        payer = voter,
        space = VoteRecord::SPACE,
        seeds = [b"vote_record", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Vote>,
    _poll_id: u64,
    option_index: u8,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let clock = Clock::get()?;
    
    // Validations
    require!(poll.is_active, VotingError::PollNotActive);
    
    require!(
        clock.unix_timestamp >= poll.start_time,
        VotingError::PollNotStarted
    );
    
    require!(
        clock.unix_timestamp <= poll.end_time,
        VotingError::PollEnded
    );
    
    require!(
        (option_index as usize) < poll.options.len(),
        VotingError::InvalidOptionIndex
    );
    
    // Record vote
    poll.votes[option_index as usize] += 1;
    poll.total_votes += 1;
    
    // Create vote record
    let vote_record = &mut ctx.accounts.vote_record;
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.poll_id = poll.poll_id;
    vote_record.option_index = option_index;
    vote_record.timestamp = clock.unix_timestamp;
    vote_record.bump = ctx.bumps.vote_record;
    
    msg!(
        "Vote recorded: Poll {}, Option {}, Voter {}",
        poll.poll_id,
        option_index,
        ctx.accounts.voter.key()
    );
    
    Ok(())
}