use anchor_lang::prelude::*;
use crate::state::{Poll, PollCounter};
use crate::errors::VotingError;

#[derive(Accounts)]
pub struct InitializePoll<'info> {
    #[account(
        init,
        payer = creator,
        space = Poll::space(options.len()),
        seeds = [b"poll", poll_counter.count.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(
        init_if_needed,
        payer = creator,
        space = PollCounter::SPACE,
        seeds = [b"poll_counter"],
        bump
    )]
    pub poll_counter: Account<'info, PollCounter>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializePoll>,
    title: String,
    description: String,
    options: Vec<String>,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    // Validations
    require!(
        title.len() <= Poll::MAX_TITLE_LENGTH,
        VotingError::TitleTooLong
    );
    
    require!(
        description.len() <= Poll::MAX_DESCRIPTION_LENGTH,
        VotingError::DescriptionTooLong
    );
    
    require!(
        options.len() >= 2,
        VotingError::NotEnoughOptions
    );
    
    require!(
        options.len() <= Poll::MAX_OPTIONS,
        VotingError::TooManyOptions
    );
    
    for option in &options {
        require!(
            option.len() <= Poll::MAX_OPTION_LENGTH,
            VotingError::OptionTooLong
        );
    }
    
    require!(
        start_time < end_time,
        VotingError::InvalidTimeRange
    );
    
    let clock = Clock::get()?;
    require!(
        end_time > clock.unix_timestamp,
        VotingError::InvalidTimeRange
    );
    
    // Initialize poll
    let poll = &mut ctx.accounts.poll;
    let poll_counter = &mut ctx.accounts.poll_counter;
    
    poll.poll_id = poll_counter.count;
    poll.creator = ctx.accounts.creator.key();
    poll.title = title;
    poll.description = description;
    poll.options = options.clone();
    poll.votes = vec![0; options.len()];
    poll.start_time = start_time;
    poll.end_time = end_time;
    poll.is_active = true;
    poll.total_votes = 0;
    poll.bump = ctx.bumps.poll;
    
    // Increment counter
    poll_counter.count += 1;
    poll_counter.bump = ctx.bumps.poll_counter;
    
    msg!("Poll created with ID: {}", poll.poll_id);
    
    Ok(())
}