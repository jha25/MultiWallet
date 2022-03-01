/** @format */
import React, { useState, useEffect } from "react"
import MultiSig from "../utils/Multisig.json"
import { getBlockChain } from "../utils/utils"

const Home = () => {
	const [web3, setWeb3] = useState()
	const [accounts, setAccounts] = useState()
	const [contract, setContract] = useState()
	const [balance, setBalance] = useState()
	const [currentTransfer, setCurrentTransfer] = useState()
	const [quorum, setQuorum] = useState()

	useEffect(() => {
		;(async () => {
			const web3 = await getBlockChain()
			const accounts = await web3.eth.getAccounts()
			const networkId = await web3.eth.net.getId()
			const deployedNetwork = MultiSig.networks[networkId]
			const contract = new web3.eth.Contract(
				MultiSig,
				deployedNetwork && deployedNetwork.address,
			)
			const quorum = await contract.methods.quorum().call()
			setWeb3(web3)
			setAccounts(accounts)
			setContract(contract)
			setQuorum(quorum)
		})()
		window.ethereum.on("accountsChanged", (accounts) => {
			setAccounts(accounts)
		})
	}, [])

	useEffect(() => {
		if (typeof contract !== "undefined" && typeof web3 !== "undefined") {
			updateBalance()
			updateCurrentTransfer()
		}
	}, [contract, accounts, web3])

	const updateBalance = async () => {
		const balance = await contract.balanceOf(currentAccount)
		setBalance(balance)
		console.log(balance)
	}

	const createTransfer = async (e) => {
		e.preventDefault()
		const amount = e.target.elements[0].value
		const to = e.target.elements[1].value
		await contract.methods
			.createTransfer(amount, to)
			.send({ from: accounts[0] })
		await updateCurrentTransfer()
	}

	const sendTransfer = async () => {
		await contract.methods
			.sendTransfer(currentTransfer.id)
			.send({ from: accounts[0] })
		await updateBalance()
		await updateCurrentTransfer()
	}

	const updateCurrentTransfer = async () => {
		const currentTransferId = await contract.methods
			.transfers(currentTransferId)
			.call()
		const alreadyApproved = await contract.methods
			.approvals(accounts[0], currentTransferId)
			.call()
		setCurrentTransfer({ ...currentTransfer, alreadyApproved })
	}

	if (!web3) {
		return <div>Loading...</div>
	}

	return (
		<div className='container'>
			<h1 className='text-center'>Multi Signature Wallet</h1>
			<div className='row'>
				<div className='col-sm-12'>
					<p>
						Balance: <b>{balance}</b> wei
					</p>
				</div>
			</div>
			{!currentTransfer || currentTransfer.approvals === quorum ? (
				<div className='row'>
					<div className='col-sm-12'>
						<h2>Create transfer</h2>
						<form onSubmit={(e) => createTransfer(e)}>
							<div className='form-group'>
								<label htmlFor='amount'>Amount</label>
								<input type='number' className='form-control' id='amount' />
							</div>
							<div className='form-group'>
								<label htmlFor='to'>To</label>
								<input type='text' className='form-control' id='to' />
							</div>
							<button type='submit' className='btn btn-primary'>
								Submit
							</button>
						</form>
					</div>
				</div>
			) : (
				<div className='row'>
					<div className='col-sm-12'>
						<h2>Approve transfer</h2>
						<ul>
							<li>TransderId: {currentTransfer.id}</li>
							<li>Amount: {currentTransfer.amount}</li>
							<li>Approvals: {currentTransfer.approvals}</li>
						</ul>
						{currentTransfer.alreadyApproved ? (
							"Already approved"
						) : (
							<button
								type='submit'
								className='btn btn-primary'
								onClick={sendTransfer}>
								Submit
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default Home
