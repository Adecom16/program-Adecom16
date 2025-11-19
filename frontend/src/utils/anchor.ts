import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';
import { IDL } from '../idl/voting';

// Your deployed program ID
export const PROGRAM_ID = new PublicKey('GwLxstntnDEmYcqP7suzhp6Ui2HK3S4ctHTtqvo8mTef');

export const getProgram = (wallet: AnchorWallet, connection: Connection) => {
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  
  // Create program with PublicKey object directly
  // @ts-ignore - IDL type compatibility
  const program = new Program(IDL, PROGRAM_ID, provider);
  return program;
};

export const getPollPDA = (pollId: number, programId: PublicKey) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(pollId));
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from('poll'), buffer],
    programId
  );
};

export const getVoteRecordPDA = (
  pollPubkey: PublicKey,
  voterPubkey: PublicKey,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote_record'), pollPubkey.toBuffer(), voterPubkey.toBuffer()],
    programId
  );
};