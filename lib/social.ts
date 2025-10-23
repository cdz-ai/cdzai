"use client"

import type { Friend, Group, DirectMessage, GroupMessage } from "@/types"

// Friends management
export function getFriends(userId: string): Friend[] {
  if (typeof window === "undefined") return []
  const friends = localStorage.getItem(`friends_${userId}`)
  return friends ? JSON.parse(friends) : []
}

export function saveFriend(userId: string, friend: Friend) {
  const friends = getFriends(userId)
  friends.push(friend)
  localStorage.setItem(`friends_${userId}`, JSON.stringify(friends))
}

export function addFriendByCode(userId: string, friendCode: string, friendUsername: string): Friend {
  const friend: Friend = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    friendUserId: Math.random().toString(36).substr(2, 9),
    friendUsername,
    friendUserCode: friendCode,
    status: "accepted",
    createdAt: new Date(),
  }
  saveFriend(userId, friend)
  return friend
}

export function removeFriend(userId: string, friendId: string) {
  const friends = getFriends(userId)
  const updated = friends.filter((f) => f.id !== friendId)
  localStorage.setItem(`friends_${userId}`, JSON.stringify(updated))
}

// Groups management
export function getGroups(userId: string): Group[] {
  if (typeof window === "undefined") return []
  const groups = localStorage.getItem(`groups_${userId}`)
  return groups ? JSON.parse(groups) : []
}

export function createGroup(userId: string, name: string, memberIds: string[]): Group {
  const group: Group = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    creatorId: userId,
    memberIds: [userId, ...memberIds],
    createdAt: new Date(),
  }
  const groups = getGroups(userId)
  groups.push(group)
  localStorage.setItem(`groups_${userId}`, JSON.stringify(groups))
  return group
}

export function deleteGroup(userId: string, groupId: string) {
  const groups = getGroups(userId)
  const updated = groups.filter((g) => g.id !== groupId)
  localStorage.setItem(`groups_${userId}`, JSON.stringify(updated))
}

// Direct messages
export function getDirectMessages(userId: string, friendId: string): DirectMessage[] {
  if (typeof window === "undefined") return []
  const key = [userId, friendId].sort().join("_")
  const messages = localStorage.getItem(`dm_${key}`)
  return messages ? JSON.parse(messages) : []
}

export function sendDirectMessage(userId: string, friendId: string, content: string, isAI = false): DirectMessage {
  const message: DirectMessage = {
    id: Math.random().toString(36).substr(2, 9),
    senderId: userId,
    receiverId: friendId,
    content,
    timestamp: new Date(),
    isAI,
  }
  const key = [userId, friendId].sort().join("_")
  const messages = getDirectMessages(userId, friendId)
  messages.push(message)
  localStorage.setItem(`dm_${key}`, JSON.stringify(messages))
  return message
}

// Group messages
export function getGroupMessages(groupId: string): GroupMessage[] {
  if (typeof window === "undefined") return []
  const messages = localStorage.getItem(`group_${groupId}`)
  return messages ? JSON.parse(messages) : []
}

export function sendGroupMessage(groupId: string, senderId: string, content: string, isAI = false): GroupMessage {
  const message: GroupMessage = {
    id: Math.random().toString(36).substr(2, 9),
    groupId,
    senderId,
    content,
    timestamp: new Date(),
    isAI,
  }
  const messages = getGroupMessages(groupId)
  messages.push(message)
  localStorage.setItem(`group_${groupId}`, JSON.stringify(messages))
  return message
}
