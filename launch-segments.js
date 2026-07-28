(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const now = Date.now();
  const day = 86400000;

  function addTag(item, tag) {
    item.tags = Array.isArray(item.tags) ? item.tags : [];
    if (!item.tags.includes(tag)) item.tags.push(tag);
  }

  for (const item of competitions) {
    const deadline = new Date(item.deadline).getTime();
    const daysLeft = Number.isFinite(deadline) ? Math.ceil((deadline - now) / day) : Infinity;
    const current = item.collection === 'current' && item.status !== 'ended' && item.entryStatus !== 'closed';
    const reviewed = item.verificationStatus === 'reviewed';
    const actionable = current && item.entryStatus !== 'restricted';

    if (actionable && daysLeft >= 0 && daysLeft <= 7) addTag(item, '本周截止');
    if (actionable && reviewed && item.difficulty === '入门') addTag(item, '零基础友好');
    if (actionable && reviewed && ['S', 'A'].includes(item.grade)) addTag(item, '高价值精选');
  }

  data.hotTags = ['高价值精选', '零基础友好', '本周截止', 'AI Agent', '数据科学'];
  data.launchSegments = [
    {
      id: 'high-value',
      tag: '高价值精选',
      title: '高价值精选',
      description: '已完成赛事级审核，评级为 S 或 A，且当前仍具备行动资格。',
      href: '#/competitions?q=%E9%AB%98%E4%BB%B7%E5%80%BC%E7%B2%BE%E9%80%89&sort=recommended',
    },
    {
      id: 'beginner',
      tag: '零基础友好',
      title: '零基础友好',
      description: '门槛相对清晰、当前可行动，并已经完成赛事级审核。',
      href: '#/competitions?q=%E9%9B%B6%E5%9F%BA%E7%A1%80%E5%8F%8B%E5%A5%BD&sort=recommended',
    },
    {
      id: 'week',
      tag: '本周截止',
      title: '本周截止',
      description: '距离截止不超过 7 天，适合立即确认资格和提交要求。',
      href: '#/competitions?q=%E6%9C%AC%E5%91%A8%E6%88%AA%E6%AD%A2&sort=deadline',
    },
  ].map((segment) => ({
    ...segment,
    count: competitions.filter((item) => (item.tags || []).includes(segment.tag)).length,
  }));
})();
