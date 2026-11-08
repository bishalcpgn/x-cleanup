<div align="center">

# 🧹 X Cleanup

**Bulk-delete your posts and replies, undo your reposts, and remove your likes on X (Twitter).**

Free, runs in your browser, and never asks for your password or an API key.

<img width="1760" height="1592" alt="image" src="https://github.com/user-attachments/assets/e9ed240b-24b8-4975-883a-df67d7d3fb5e" />


</div>

> [!WARNING]
> Deleted posts can't be recovered, so download your X archive first if you want a backup. Automating actions is against X's Terms of Service; use this at your own risk. Not affiliated with X Corp.

## How to use

1. Open [`x-cleanup.js`](x-cleanup.js) and click **Copy raw file**.
2. Go to [x.com](https://x.com) on a computer and log in.
3. Open the console with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd> (Chrome, Edge, Brave) or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> (Firefox). On a Mac, it's <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>J</kbd> or <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>K</kbd>.
4. Paste the script and press <kbd>Enter</kbd>. If pasting is blocked, type `allow pasting`, press Enter, and paste again.
5. Choose what to remove and how many, then click **Remove**. Try 3 first.

The script opens the right pages by itself and shows its progress in the corner. Click **Stop** or refresh the page to stop it.

## What it removes

| Option | What happens |
|---|---|
| ✍️ **Posts** | Deletes your posts |
| 💬 **Replies** | Deletes your replies and keeps your regular posts |
| 🔁 **Reposts** | Undoes your reposts |
| ❤️ **Likes** | Removes your likes |

Narrow it down with a date range or keywords, and set the pace between actions.

## Good to know

- Set X's language to English to delete posts and replies.
- Keep the browser window wide enough to show X's left sidebar.
- Follow-ups in your own threads count as replies.
- X only lets you reach roughly your 3,200 most recent posts.
- Nothing is sent anywhere or saved. The script only clicks the buttons you would.

## Something not working?

When nothing gets removed, the console prints a one-line report. [Open an issue](../../issues) and paste it in.

## License

[MIT](LICENSE)
