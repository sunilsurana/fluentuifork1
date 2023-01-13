import { Octokit as gihubApi } from '@octokit/rest';
import { getEnv } from './getEnv';

const octokit = new gihubApi({
    auth: getEnv('GITHUB_API_TOKEN'),
});

type GitPR = {
    owner: string,
    repo: string,
    prNumber: number
};

export async function getIssueCommentId(gitPR: GitPR, commentStr): Promise<number> {
    const commentList = await octokit.rest.issues.listComments({
        owner: gitPR.owner,
        repo: gitPR.repo,
        issue_number: gitPR.prNumber,
    });

    const arrayComment = commentList.data;
    let issueCommentId = -1;

    arrayComment.forEach(item => {
        //if (item.body.includes('vrtComment' + clientType)) {
        if (item.body.includes(commentStr)) {
            issueCommentId = item.id;
            return issueCommentId;
        }
    });
    return issueCommentId;
}

export async function getReviewCommentId(gitPR: GitPR, commentStr): Promise<number> {
    const commentList = await octokit.rest.pulls.listReviewComments({
        owner: gitPR.owner,
        repo: gitPR.repo,
        pull_number: gitPR.prNumber,
    });

    const arrayComment = commentList.data;
    let commentId = -1;

    arrayComment.forEach(item => {
        //if (item.body.includes('vrtComment' + clientType)) {
        if (item.body.includes(commentStr)) {
            commentId = item.id;
            return commentId;
        }
    });
    return commentId;
}

export async function deleteIssueComment(gitPR, commentId) {
    await octokit.rest.issues.deleteComment({
        owner: gitPR.owner,
        repo: gitPR.repo,
        comment_id: commentId
    });
}

export async function deleteReviewComment(gitPR, commentId) {
    await octokit.rest.pulls.deleteReviewComment({
        owner: gitPR.owner,
        repo: gitPR.repo,
        comment_id: commentId
    });
}

export async function updateIssueComment(gitPR, commentId, body) {
    await octokit.rest.issues.updateComment({
        owner: gitPR.owner,
        repo: gitPR.repo,
        comment_id: commentId,
        body: body
    });
}

export async function updateReviewComment(gitPR, commentId, body) {
    await octokit.rest.pulls.updateReviewComment({
        owner: gitPR.owner,
        repo: gitPR.repo,
        comment_id: commentId,
        body: body
    });
}

export async function createIssueComment(gitPR, body) {
    await octokit.rest.issues.createComment({
        owner: gitPR.owner,
        repo: gitPR.repo,
        issue_number: gitPR.prNumber,
        body: body
    });
}


export async function createReviewComment(gitPR, body) {
    const files = await octokit.rest.pulls.listFiles({
        owner: gitPR.owner,
        repo: gitPR.repo,
        pull_number: gitPR.prNumber,
        per_page: 1
    });
    const file = files.data[0]
    console.log(file);
    const firstModifiedLineAfterCommit = Number(file.patch?.split("+")[1]?.split(",")[0]) ?? 0;
    console.log(firstModifiedLineAfterCommit);
    const fileName = file.filename;
    console.log(fileName);
    const commitid = file.blob_url.split("blob/")[1].split("/")[0];
    console.log(commitid);

    await octokit.rest.pulls.createReviewComment({
        owner: gitPR.owner,
        repo: gitPR.repo,
        pull_number: gitPR.prNumber,
        body: body,
        commit_id: commitid,
        path: fileName,
        line: firstModifiedLineAfterCommit
    });
}




