use anchor_lang::prelude::*;
use crate::state::Poll;
use crate::errors::VotingError;

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct ClosePoll<'info> {
    #[account(
        mut,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump = poll.bump,
        constraint = poll.creator == creator.key() @ VotingError::UnauthorizedClose
    )]
    pub poll: Account<'info, Poll>,
    
    pub creator: Signer<'info>,
}

pub fn handler(ctx: Context<ClosePoll>, _poll_id: u64) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    
    poll.is_active = false;
    
    msg!("Poll {} closed by creator", poll.poll_id);
    
    Ok(())
}