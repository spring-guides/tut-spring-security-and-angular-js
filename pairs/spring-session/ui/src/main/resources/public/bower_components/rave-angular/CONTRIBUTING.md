_Thanks for your interest in this project.  Do you have something you'd like
to contribute?  We welcome pull requests, but ask that you read this document
first to understand how best to submit them and what kind of changes are likely
to be accepted._

_Please refer back to this document as a checklist before issuing any pull
request; this will save time for everyone!_


## Understand the basics

Not sure what a pull request (PR) is? Or how to submit one?  Take a look at
GitHub's excellent [help documentation][] first.


## Search GitHub issues first; create an issue if necessary

Is there already an issue that addresses your concern?  Do a bit of searching
in our [issue tracker][] to see if you can find something similar. If not,
consider creating a new issue for discussion before submitting a pull request
unless the change is truly trivial, e.g. typo fixes, etc.


## General guidelines

* This package is intentionally tiny. If you want to add more than a few lines
  of code, you should probably create a new package! :)
* Feel free to work off the master branch.  This project is tiny.

## Mind the whitespace, thank you!

Please carefully follow the whitespace and formatting conventions already
present in the framework.

1. Tabs, not spaces
1. Unix (LF), not DOS (CRLF) line endings
1. Eliminate trailing whitespace and leave one blank line at the end of a file
1. Wrap JSDoc and other comments at 80 characters
1. Aim to wrap code at 80 characters, but favor readability over wrapping
1. Preserve existing formatting; i.e. do not reformat code for its own sake
1. No cuddling of `else`, `catch`, etc.
1. Keep one space on each side of the parameter list in function *declarations*
1. utf8 encoding for JS sources, escape special characters


## Update license info

Add @author JSDoc, if you've added significant code.
Always check the date range in the license header.

```javascript
/** @license MIT License (c) copyright 2014 original authors */
/** @author FirstName LastName <OptionalEmailAddress> */
```

If you are uncomfortable making the contribution under the MIT license, please
contact us before making a contribution.


## Submit unit test cases for all behavior changes

Search the codebase to find related unit tests and add additional test methods.
Create new test cases for new modules.


## Run all tests prior to submission

See the building from source section of the README for instructions. Make sure
that all tests pass prior to submitting your pull request.


## Submit your pull request

Subject line:

Follow the same conventions for pull request subject lines as mentioned above
for commit message subject lines.  In the body:

1. Explain your use case. What led you to submit this change? Why were existing
    mechanisms in the framework insufficient? Make a case that this is a
    general-purpose problem and that yours is a general-purpose solution, etc.
1. Add any additional information and ask questions; start a conversation, or
    continue one from an existing issue
1. Mention the issue ID

Note that for pull requests containing a single commit, GitHub will default the
subject line and body of the pull request to match the subject line and body of
the commit message. This is fine, but please also include the items above in the
body of the request.


## Mention your pull request on the associated issue

Add a comment to the associated issue(s) linking to your new pull request.

Expect to have to make a few changes before your PR is accepted.  We are picky.

Note that you can always force push (`git push -f`) reworked / rebased commits
against the branch used to submit your pull request. i.e. you do not need to
issue a new pull request when asked to make changes.


[help documentation]: http://help.github.com/send-pull-requests
[issue tracker]: https://github.com/cujojs/rest/issues
[mailing list]: https://groups.google.com/forum/#!forum/cujojs
[fork-and-edit]: https://github.com/blog/844-forking-with-the-edit-button
[commit guidelines section of Pro Git]: http://progit.org/book/ch5-2.html#commit_guidelines
