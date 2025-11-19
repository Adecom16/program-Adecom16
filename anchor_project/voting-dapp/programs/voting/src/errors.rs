use anchor_lang::prelude::*;

#[error_code]
pub enum VotingError {
    #[msg("Poll title is too long")]
    TitleTooLong,
    
    #[msg("Poll description is too long")]
    DescriptionTooLong,
    
    #[msg("Option text is too long")]
    OptionTooLong,
    
    #[msg("Too many options. Maximum is 10")]
    TooManyOptions,
    
    #[msg("Not enough options. Minimum is 2")]
    NotEnoughOptions,
    
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    
    #[msg("Poll has ended")]
    PollEnded,
    
    #[msg("Poll has not started yet")]
    PollNotStarted,
    
    #[msg("Poll is not active")]
    PollNotActive,
    
    #[msg("Already voted in this poll")]
    AlreadyVoted,
    
    #[msg("Invalid time range")]
    InvalidTimeRange,
    
    #[msg("Only poll creator can close the poll")]
    UnauthorizedClose,
}