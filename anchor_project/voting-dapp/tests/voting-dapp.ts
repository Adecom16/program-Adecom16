import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { assert } from "chai";

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Voting as Program<Voting>;
  const creator = provider.wallet as anchor.Wallet;
  
  let pollId = 0;
  let pollPda: anchor.web3.PublicKey;
  let counterPda: anchor.web3.PublicKey;

  before(async () => {
    // Derive PDAs
    [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll_counter")],
      program.programId
    );
  });

  it("Creates a new poll", async () => {
    const title = "Favorite Programming Language";
    const description = "Vote for your favorite programming language";
    const options = ["Rust", "TypeScript", "Python", "Go"];
    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now);
    const endTime = new anchor.BN(now + 86400); // 24 hours

    [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      program.programId
    );

    const tx = await program.methods
      .initializePoll(title, description, options, startTime, endTime)
      .accounts({
        poll: pollPda,
        pollCounter: counterPda,
        creator: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Poll created:", tx);

    const pollAccount = await program.account.poll.fetch(pollPda);
    assert.equal(pollAccount.title, title);
    assert.equal(pollAccount.description, description);
    assert.equal(pollAccount.options.length, 4);
    assert.equal(pollAccount.isActive, true);
    assert.equal(pollAccount.totalVotes.toNumber(), 0);
  });

  it("Casts a vote", async () => {
    const optionIndex = 0; // Vote for Rust

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote_record"),
        pollPda.toBuffer(),
        creator.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tx = await program.methods
      .vote(new anchor.BN(pollId), optionIndex)
      .accounts({
        poll: pollPda,
        voteRecord: voteRecordPda,
        voter: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Vote cast:", tx);

    const pollAccount = await program.account.poll.fetch(pollPda);
    assert.equal(pollAccount.votes[optionIndex].toNumber(), 1);
    assert.equal(pollAccount.totalVotes.toNumber(), 1);

    const voteRecord = await program.account.voteRecord.fetch(voteRecordPda);
    assert.equal(voteRecord.optionIndex, optionIndex);
  });

  it("Fails to vote twice", async () => {
    const optionIndex = 1;

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote_record"),
        pollPda.toBuffer(),
        creator.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .vote(new anchor.BN(pollId), optionIndex)
        .accounts({
          poll: pollPda,
          voteRecord: voteRecordPda,
          voter: creator.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed - already voted");
    } catch (error) {
      assert.include(error.message, "already in use");
    }
  });

  it("Fails to vote with invalid option", async () => {
    const voter2 = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to voter2
    const airdropSig = await provider.connection.requestAirdrop(
      voter2.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const optionIndex = 99; // Invalid

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote_record"),
        pollPda.toBuffer(),
        voter2.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .vote(new anchor.BN(pollId), optionIndex)
        .accounts({
          poll: pollPda,
          voteRecord: voteRecordPda,
          voter: voter2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();
      assert.fail("Should have failed - invalid option");
    } catch (error) {
      assert.include(error.message, "InvalidOptionIndex");
    }
  });

  it("Closes a poll", async () => {
    const tx = await program.methods
      .closePoll(new anchor.BN(pollId))
      .accounts({
        poll: pollPda,
        creator: creator.publicKey,
      })
      .rpc();

    console.log("Poll closed:", tx);

    const pollAccount = await program.account.poll.fetch(pollPda);
    assert.equal(pollAccount.isActive, false);
  });

  it("Fails to vote on closed poll", async () => {
    const voter3 = anchor.web3.Keypair.generate();
    
    const airdropSig = await provider.connection.requestAirdrop(
      voter3.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const optionIndex = 0;

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote_record"),
        pollPda.toBuffer(),
        voter3.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .vote(new anchor.BN(pollId), optionIndex)
        .accounts({
          poll: pollPda,
          voteRecord: voteRecordPda,
          voter: voter3.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter3])
        .rpc();
      assert.fail("Should have failed - poll closed");
    } catch (error) {
      assert.include(error.message, "PollNotActive");
    }
  });

  it("Creates a second poll", async () => {
    const title = "Best Blockchain";
    const description = "Which blockchain platform do you prefer?";
    const options = ["Solana", "Ethereum", "Polygon"];
    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now);
    const endTime = new anchor.BN(now + 86400);

    pollId = 1;
    [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from([1, 0, 0, 0, 0, 0, 0, 0])],
      program.programId
    );

    await program.methods
      .initializePoll(title, description, options, startTime, endTime)
      .accounts({
        poll: pollPda,
        pollCounter: counterPda,
        creator: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);
    assert.equal(pollAccount.pollId.toNumber(), 1);
  });
});