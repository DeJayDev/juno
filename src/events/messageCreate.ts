import { chat } from "@/util/chat"
import { getOptionsFor } from "@/util/options"
import { getMessageHistory } from "@/util/replies"
import { type ClientEvents, MessageReferenceType } from "discord.js"
import type { SlashasaurusClient } from "slashasaurus"

type Message = ClientEvents["messageCreate"][0]

export default async function (client: SlashasaurusClient, message: Message) {
    if (message.author.bot) return

    const isJunoReply = await isReplyToJuno(client, message)
    if (!isJunoReply && !message.content.startsWith(`<@${client.user?.id}>`)) return

    const userOptions = await getOptionsFor(message.author.id)
    if (userOptions.ignored) return

    const content = message.content.replace(`<@${client.user?.id}>`, "").trim()
    if (!content) return

    try {
        const messageHistory = await getMessageHistory(client, message)
        const response = await chat(content, messageHistory, message.author)

        await message.reply({
            content: response,
            allowedMentions: { repliedUser: true, parse: [] }
        })
    } catch (error) {
        console.error("Error processing message:", error)
        await message.reply({
            content: "I encountered an error processing your message. Please try again later.",
            allowedMentions: { repliedUser: true, parse: [] }
        })
    }
}

async function isReplyToJuno(client: SlashasaurusClient, message: Message): Promise<boolean> {
    if (message.reference?.type !== MessageReferenceType.Default) {
        return false
    }

    try {
        const referenced = await message.fetchReference()
        return referenced.author.id === client.user?.id
    } catch (error) {
        console.error("Error fetching referenced message:", error)
        return false
    }
}
