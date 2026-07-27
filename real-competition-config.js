(() => {
  if (!window.AI_DATA?.realCompetitionMode) return;
  const competitions = window.AI_DATA.competitions || [];
  window.AI_DATA.tracks = [...new Set(competitions.map((item) => item.track).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  window.AI_DATA.hotTags = ['AI Agent', '大学生', '个人参赛', '奖金赛事', '数据科学', '大模型应用'];
})();
