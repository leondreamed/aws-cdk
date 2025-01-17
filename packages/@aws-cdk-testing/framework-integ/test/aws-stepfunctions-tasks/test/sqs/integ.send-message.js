"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqs = require("aws-cdk-lib/aws-sqs");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const cdk = require("aws-cdk-lib");
const aws_stepfunctions_tasks_1 = require("aws-cdk-lib/aws-stepfunctions-tasks");
/*
 * Creates a state machine with a task state to send a message to an SQS
 * queue.
 *
 * When the state machine is executed, it will send a message to our
 * queue, which can subsequently be consumed.
 *
 * Stack verification steps:
 * The generated State Machine can be executed from the CLI (or Step Functions console)
 * and runs with an execution status of `Succeeded`.
 *
 * -- aws stepfunctions start-execution --state-machine-arn <state-machine-arn-from-output> provides execution arn
 * -- aws stepfunctions describe-execution --execution-arn <from previous command> returns a status of `Succeeded`
 * -- aws sqs receive-message --queue-url <queue-url-from-output> has a message of 'sending message over'
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-stepfunctions-tasks-sqs-send-message-integ');
const queue = new sqs.Queue(stack, 'show-me-the-messages');
const sendMessageTask = new aws_stepfunctions_tasks_1.SqsSendMessage(stack, 'send message to sqs', {
    queue,
    messageBody: sfn.TaskInput.fromText('sending message over'),
});
const finalStatus = new sfn.Pass(stack, 'Final step');
const chain = sfn.Chain.start(sendMessageTask)
    .next(finalStatus);
const sm = new sfn.StateMachine(stack, 'StateMachine', {
    definition: chain,
    timeout: cdk.Duration.seconds(30),
});
new cdk.CfnOutput(stack, 'stateMachineArn', {
    value: sm.stateMachineArn,
});
new cdk.CfnOutput(stack, 'queueUrl', {
    value: queue.queueUrl,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc2VuZC1tZXNzYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuc2VuZC1tZXNzYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLHFEQUFxRDtBQUNyRCxtQ0FBbUM7QUFDbkMsaUZBQXFFO0FBRXJFOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO0FBQ25GLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztBQUUzRCxNQUFNLGVBQWUsR0FBRyxJQUFJLHdDQUFjLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFO0lBQ3ZFLEtBQUs7SUFDTCxXQUFXLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7Q0FDNUQsQ0FBQyxDQUFDO0FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztBQUV0RCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUM7S0FDM0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRXJCLE1BQU0sRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO0lBQ3JELFVBQVUsRUFBRSxLQUFLO0lBQ2pCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Q0FDbEMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRTtJQUMxQyxLQUFLLEVBQUUsRUFBRSxDQUFDLGVBQWU7Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7SUFDbkMsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRO0NBQ3RCLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCAqIGFzIHNmbiBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucyc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgU3FzU2VuZE1lc3NhZ2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucy10YXNrcyc7XG5cbi8qXG4gKiBDcmVhdGVzIGEgc3RhdGUgbWFjaGluZSB3aXRoIGEgdGFzayBzdGF0ZSB0byBzZW5kIGEgbWVzc2FnZSB0byBhbiBTUVNcbiAqIHF1ZXVlLlxuICpcbiAqIFdoZW4gdGhlIHN0YXRlIG1hY2hpbmUgaXMgZXhlY3V0ZWQsIGl0IHdpbGwgc2VuZCBhIG1lc3NhZ2UgdG8gb3VyXG4gKiBxdWV1ZSwgd2hpY2ggY2FuIHN1YnNlcXVlbnRseSBiZSBjb25zdW1lZC5cbiAqXG4gKiBTdGFjayB2ZXJpZmljYXRpb24gc3RlcHM6XG4gKiBUaGUgZ2VuZXJhdGVkIFN0YXRlIE1hY2hpbmUgY2FuIGJlIGV4ZWN1dGVkIGZyb20gdGhlIENMSSAob3IgU3RlcCBGdW5jdGlvbnMgY29uc29sZSlcbiAqIGFuZCBydW5zIHdpdGggYW4gZXhlY3V0aW9uIHN0YXR1cyBvZiBgU3VjY2VlZGVkYC5cbiAqXG4gKiAtLSBhd3Mgc3RlcGZ1bmN0aW9ucyBzdGFydC1leGVjdXRpb24gLS1zdGF0ZS1tYWNoaW5lLWFybiA8c3RhdGUtbWFjaGluZS1hcm4tZnJvbS1vdXRwdXQ+IHByb3ZpZGVzIGV4ZWN1dGlvbiBhcm5cbiAqIC0tIGF3cyBzdGVwZnVuY3Rpb25zIGRlc2NyaWJlLWV4ZWN1dGlvbiAtLWV4ZWN1dGlvbi1hcm4gPGZyb20gcHJldmlvdXMgY29tbWFuZD4gcmV0dXJucyBhIHN0YXR1cyBvZiBgU3VjY2VlZGVkYFxuICogLS0gYXdzIHNxcyByZWNlaXZlLW1lc3NhZ2UgLS1xdWV1ZS11cmwgPHF1ZXVlLXVybC1mcm9tLW91dHB1dD4gaGFzIGEgbWVzc2FnZSBvZiAnc2VuZGluZyBtZXNzYWdlIG92ZXInXG4gKi9cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3Mtc3FzLXNlbmQtbWVzc2FnZS1pbnRlZycpO1xuY29uc3QgcXVldWUgPSBuZXcgc3FzLlF1ZXVlKHN0YWNrLCAnc2hvdy1tZS10aGUtbWVzc2FnZXMnKTtcblxuY29uc3Qgc2VuZE1lc3NhZ2VUYXNrID0gbmV3IFNxc1NlbmRNZXNzYWdlKHN0YWNrLCAnc2VuZCBtZXNzYWdlIHRvIHNxcycsIHtcbiAgcXVldWUsXG4gIG1lc3NhZ2VCb2R5OiBzZm4uVGFza0lucHV0LmZyb21UZXh0KCdzZW5kaW5nIG1lc3NhZ2Ugb3ZlcicpLFxufSk7XG5cbmNvbnN0IGZpbmFsU3RhdHVzID0gbmV3IHNmbi5QYXNzKHN0YWNrLCAnRmluYWwgc3RlcCcpO1xuXG5jb25zdCBjaGFpbiA9IHNmbi5DaGFpbi5zdGFydChzZW5kTWVzc2FnZVRhc2spXG4gIC5uZXh0KGZpbmFsU3RhdHVzKTtcblxuY29uc3Qgc20gPSBuZXcgc2ZuLlN0YXRlTWFjaGluZShzdGFjaywgJ1N0YXRlTWFjaGluZScsIHtcbiAgZGVmaW5pdGlvbjogY2hhaW4sXG4gIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ3N0YXRlTWFjaGluZUFybicsIHtcbiAgdmFsdWU6IHNtLnN0YXRlTWFjaGluZUFybixcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ3F1ZXVlVXJsJywge1xuICB2YWx1ZTogcXVldWUucXVldWVVcmwsXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=