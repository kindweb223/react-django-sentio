import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Redirect from 'react-router-dom/Redirect';

import {api} from './../utils/Api';

import NotFound from './../components/NotFound';
import MyPoll from './../components/MyPoll';
import EditPoll from './../components/EditPoll';


class MyPollContainer extends Component {

    /*Single Poll Container*/

    constructor(props) {
        super(props);
        this.state = {
            poll: [],
            totalVotes: 0,
            fetched: false,
            isError: false,
            voted: false,
            editPoll: false,
            pollUpdated: false,
            pollDeleted: false,
        }
    }

    componentWillUnmount() {
        clearInterval(this.pollDataTimer);
    }

    componentDidMount() {
        this.getPoll();
        this.pollDataTimer = setInterval(() => {
            if(!this.state.editPoll && (!this.state.pollDeleted || !this.state.editPoll)){
                this.getPoll();
            }
        }, 5000);
    }

    getPoll = () => {
        this.questionId = this.props.match.params.questionId;
        api.fetchSinglePoll(this.questionId)
            .then((poll) => {
                if (poll === 404){
                    this.setState({
                        fetched: true,
                        isError: true,
                    });
                }
                else{
                    let totalVotes = 0;
                    poll.choices.forEach((el, index) => {
                        totalVotes+=el.vote;
                    });
                    this.setState({
                        fetched: true,
                        poll,
                        totalVotes,
                    });
                }
            });
    }

    onVoteSelectChange = (event) => {
        this.choiceId = event.target.value;
    }

    onVote = (event) => {
        if(!this.state.voted){
            if(typeof this.choiceId === "undefined"){
                this.choiceId = this.state.poll.choices[0].choice_id;
            }
            this.setState({
                totalVotes: this.state.totalVotes+1,
            });
            api.postVote(this.questionId, this.choiceId)
                .then((response) => {
                    if(response === 403){
                        this.setState({
                            voted: true,
                            totalVotes: this.state.totalVotes-1,
                        });
                    }
                    else{
                        api.fetchSinglePoll(this.questionId)
                            .then((poll) => {
                                this.setState({
                                    poll,
                                });
                            })
                    }
                })
        }
    }

    onEdit = (event) =>{
        this.setState({
            editPoll: true,
        })
    }

    onDelete = (event) =>{
        api.deletePoll(this.questionId)
            .then((response) => {
                if(response === 204){
                    this.setState({
                        pollDeleted: true,
                    })
                }
            })
    }

    onPollUpdate = (title, choices) =>{
        api.pollUpdate(this.questionId, title, choices)
            .then((response) =>{
                if(response.status === 200){
                    this.setState({
                        pollUpdated: true,
                        poll: response.poll,
                    })
                }
            })
    }

    editFinish = () =>{
        this.setState({
            editPoll: false,
        })
    }

    render() {
        return (
            this.state.pollDeleted
            ?(
                <Redirect to="/mypolls" />
            )
            :(
                !this.state.fetched
                ?(
                    <div className="ui active inverted dimmer">
                        <div className="ui text loader">Loading the poll...</div>
                    </div>
                )
                :(
                    !this.state.isError
                    ?(
                        <div>
                            {
                                this.state.editPoll
                                ?(
                                    <EditPoll 
                                        poll={this.state.poll}
                                        onPollUpdate={this.onPollUpdate}
                                        pollUpdated={this.state.pollUpdated}
                                        goBack={this.editFinish}/>
                                )
                                :(
                                    <MyPoll 
                                        poll={this.state.poll}
                                        totalVotes={this.state.totalVotes}
                                        onVoteSelectChange={this.onVoteSelectChange}
                                        onVote={this.onVote}
                                        voted={this.state.voted}
                                        onEdit={this.onEdit}
                                        onDelete={this.onDelete}
                                    />
                                )
                            }
                        </div>
                    )
                    :(
                        <NotFound/>
                    )
                )
            )
        );
    }
}

MyPollContainer.propTypes = {
    className: PropTypes.string,
};

export default MyPollContainer;
