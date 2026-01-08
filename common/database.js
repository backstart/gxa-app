const KEYS = {
  vehicles: 'db_vehicles',
  history: 'db_history',
  approvals: 'db_approvals',
  metrics: 'db_metrics',
  todos: 'db_todos',
  shortcuts: 'db_shortcuts',
  chat: 'db_chat_messages',
  scene: 'db_scene_items',
  dispose: 'db_dispose_items',
  dispatches: 'db_dispatches',
  tasks: 'db_tasks',
  disputes: 'db_disputes',
  keyPlaces: 'db_key_places',
  keyPersons: 'db_key_persons',
  patrolPoints: 'db_patrol_points',
  incidents: 'db_incidents',
  shifts: 'db_shifts',
  places: 'db_places',
  placeProfiles: 'db_place_profiles',
  placeVisits: 'db_place_visits',
  cars: 'db_cars',
  carUseLogs: 'db_car_use_logs',
  policeDetails: 'db_police_details',
  venueDetails: 'db_venue_details',
};

export const statusText = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  idle: '空闲',
  in_use: '使用中',
  maintenance: '维护中',
  completed: '已完成',
};

const defaults = {
  vehicles: [
    { id: 'car-1', plate: '粤A-0001', type: 'SUV', status: 'idle', mileage: 23540, occupant: '' },
    { id: 'car-2', plate: '粤A-0002', type: '轿车', status: 'in_use', mileage: 17890, occupant: '李警官' },
    { id: 'car-3', plate: '粤A-0003', type: '面包车', status: 'maintenance', mileage: 41200, occupant: '' },
    { id: 'car-4', plate: '粤A-0004', type: 'SUV', status: 'idle', mileage: 9650, occupant: '' },
  ],
  history: [
    { id: 'his-1', applicant: '李警官', vehicleId: 'car-2', purpose: '临检', destination: '江北路口', startMileage: 17800, endMileage: 17890, status: 'completed', comment: '准时归队' },
    { id: 'his-2', applicant: '赵警官', vehicleId: 'car-3', purpose: '物资运输', destination: '警务站', startMileage: 41000, endMileage: 41200, status: 'rejected', comment: '车辆维护中' },
  ],
  approvals: [
    { id: 'ap-1', applicant: '李警官', vehicleId: 'car-2', purpose: '临检', destination: '江北路口', startMileage: 17800, endMileage: 17890, status: 'completed', comment: '' },
  ],
  metrics: [
    { key: 'alert', title: '未回告警情', value: 7, desc: '待反馈警情' },
    { key: 'task', title: '临期任务', value: 3, desc: '24小时内到期' },
    { key: 'dispute', title: '待回访纠纷', value: 5, desc: '跟进群众回访' },
    { key: 'closed', title: '今日闭环数', value: 12, desc: '已完成闭环' },
  ],
  todos: [
    { id: 'todo-1', type: 'alert', refId: 'inc-1', title: '桂南路口纠纷处置', risk: '高', deadline: '14:00', status: 'pending', url: '/pages/policeDetail/policeDetail' },
    { id: 'todo-2', type: 'task', refId: 'task-1', title: '主防巡逻-龙石片区', risk: '中', deadline: '16:30', status: 'pending', url: '/pages/task/detail?taskId=task-1' },
    { id: 'todo-3', type: 'dispute', refId: 'dis-1', title: '长命水邻里矛盾回访', risk: '低', deadline: '今日', status: 'processing', url: '/pages/venue/venue' },
    { id: 'todo-4', type: 'order', refId: 'disp-1001', title: '图上指挥派单-卡口布控', risk: '高', deadline: '15:20', status: 'pending', url: '/pages/dispatch/detail?dispatchId=disp-1001' },
  ],
  shortcuts: [
    { key: 'alertList', title: '警情列表', emoji: '🚨', url: '/pages/policeDetail/policeDetail' },
    { key: 'task', title: '主防任务', emoji: '🛡️', url: '/pages/task/list' },
    { key: 'dispute', title: '矛盾纠纷', emoji: '🤝', url: '/pages/venue/venue' },
    { key: 'command', title: '图上指挥', emoji: '🗺️', url: '/subPackages/map/index' },
    { key: 'handover', title: '交接班', emoji: '🔄', url: '/pages/handwork/handwork' },
  ],
  chat: [
    { id: 'd1', type: 'date', content: '2025年08月21日 10:00' },
    { id: 'm1', user: '李警官', content: '我已到达现场，情绪基本稳定。', time: '10:20', self: false, avatar: '/static/avatar/a1.png' },
    { id: 'm2', user: '王警官', content: '路上有点堵，预计10分钟后到。', time: '10:21', self: false, avatar: '/static/avatar/a2.png' },
    { id: 'm3', user: '张警官', content: '建议联系家属协助疏导。', time: '10:22', self: true, avatar: '/static/avatar/me.png' },
    { id: 'm4', user: '指挥席', content: '注意安全，先稳定情绪，等待增援。', time: '10:23', self: false, avatar: '/static/avatar/a3.png' },
  ],
  scene: [
    { id: 's1', title: '现场照片', desc: '上传2张现场照', time: '10:18' },
    { id: 's2', title: '报警人补充信息', desc: '情绪波动，需医生评估', time: '10:25' },
  ],
  dispose: [
    { id: 'd1', title: '处置进展', desc: '劝解成功，已联系家属陪同', time: '10:40' },
  ],
  dispatches: [],
  tasks: [
    { id: 'task-1', title: '龙石片区巡逻', address: '龙石片区', riskLevel: '中', status: 'pending', type: 'PATROL', deadline: '2025-12-31 18:00', feedbacks: [], url: '/pages/task/detail?taskId=task-1' },
    { id: 'task-2', title: '桂南市场守点', address: '桂南市场', riskLevel: '高', status: 'pending', type: 'PATROL', deadline: '2025-12-30 20:00', feedbacks: [], url: '/pages/task/detail?taskId=task-2' },
    { id: 'task-3', title: '江北夜巡', address: '江北街道', riskLevel: '低', status: 'pending', type: 'PATROL', deadline: '2025-12-29 22:00', feedbacks: [], url: '/pages/task/detail?taskId=task-3' },
  ],
  disputes: [
    { id: 'dis-1', title: '邻里矛盾回访', address: '长命水社区', riskLevel: '中', url: '/pages/policeDetail/policeDetail' },
    { id: 'dis-2', title: '家庭纠纷调处', address: '龙石片区', riskLevel: '高', url: '/pages/policeDetail/policeDetail' },
    { id: 'dis-3', title: '商铺噪音纠纷', address: '江北商业街', riskLevel: '低', url: '/pages/policeDetail/policeDetail' },
  ],
  keyPlaces: [
    { id: 'kp-1', name: '龙井坊KTV', address: '龙井路', riskLevel: '高', url: '/pages/venue/KTVVenue' },
    { id: 'kp-2', name: '晨曦足浴', address: '解放路', riskLevel: '中', url: '/pages/venue/footbathVenue' },
    { id: 'kp-3', name: '桂南出租屋', address: '桂南小区3栋', riskLevel: '低', url: '/pages/venue/rentalhouseVenue' },
  ],
  keyPersons: [
    { id: 'person-1', name: '张*', community: '桂南社区', riskLevel: '高', url: '/pages/policeDetail/policeDetail' },
    { id: 'person-2', name: '李*', community: '江北社区', riskLevel: '中', url: '/pages/policeDetail/policeDetail' },
    { id: 'person-3', name: '王*', community: '龙石社区', riskLevel: '低', url: '/pages/policeDetail/policeDetail' },
  ],
  patrolPoints: [
    { id: 'pt-1', name: '桂南路口卡点', address: '桂南片区', riskLevel: '中', url: '/pages/dispatch/detail' },
    { id: 'pt-2', name: '龙石广场', address: '龙石片区', riskLevel: '低', url: '/pages/dispatch/detail' },
    { id: 'pt-3', name: '江北市场周界', address: '江北片区', riskLevel: '中', url: '/pages/dispatch/detail' },
  ],
  incidents: [
    { id: 'inc-1', title: '桂南路口纠纷', address: '桂南路口', riskLevel: '高', url: '/pages/policeDetail/policeDetail' },
    { id: 'inc-2', title: '江北报警', address: '江北街道', riskLevel: '中', url: '/pages/policeDetail/policeDetail' },
    { id: 'inc-3', title: '龙石噪音警情', address: '龙石社区', riskLevel: '低', url: '/pages/policeDetail/policeDetail' },
  ],
  shifts: [
    {
      shiftId: 'shift-1',
      handoverTime: '2025-12-20 08:00',
      currentShift: 'A组-李警官',
      nextShift: { id: 'u2', name: 'B组-王警官' },
      overallRemark: '注意龙石片区纠纷回访，优先处理高风险警情。',
      items: [
        {
          type: 'alert',
          refId: 'inc-1',
          title: '桂南路口纠纷',
          risk: '高',
          status: '未结',
          assignedToUserId: 'u2',
          assignedToUserName: '王警官',
          deadline: '2025-12-20 18:00',
          requirement: '请在18:00前回告并补录处置经过。',
          priority: '高',
          needVisit: false,
          confirmed: true,
        },
        {
          type: 'task',
          refId: 'task-2',
          title: '桂南市场守点',
          risk: '高',
          status: 'pending',
          assignedToUserId: 'u3',
          assignedToUserName: '张警官',
          deadline: '2025-12-20 20:00',
          requirement: '按计划守点并上传照片反馈。',
          priority: '高',
          needVisit: false,
          confirmed: false,
        },
      ],
      createdAt: '2025-12-20T00:00:00.000Z',
    },
    {
      shiftId: 'shift-2',
      handoverTime: '2025-12-19 08:00',
      currentShift: 'B组-王警官',
      nextShift: { id: 'u1', name: 'A组-李警官' },
      overallRemark: '巡逻点江北市场需关注，纠纷回访安排今日完成。',
      items: [
        {
          type: 'order',
          refId: 'disp-1001',
          title: '派单-江北市场巡逻',
          risk: '中',
          status: 'pending',
          assignedToUserId: 'u1',
          assignedToUserName: '李警官',
          deadline: '2025-12-19 18:00',
          requirement: '巡逻并反馈可疑情况。',
          priority: '中',
          needVisit: false,
          confirmed: false,
        },
        {
          type: 'dispute',
          refId: 'dis-2',
          title: '家庭纠纷回访',
          risk: '高',
          status: '未结',
          assignedToUserId: 'u4',
          assignedToUserName: '陈警官',
          deadline: '2025-12-19 17:00',
          requirement: '完成回访，必要时安排二次调处。',
          priority: '高',
          needVisit: true,
          confirmed: true,
        },
      ],
      createdAt: '2025-12-19T00:00:00.000Z',
    },
    {
      shiftId: 'shift-3',
      handoverTime: '2025-12-18 08:00',
      currentShift: 'C组-陈警官',
      nextShift: { id: 'u2', name: 'B组-王警官' },
      overallRemark: '重点人张*需跟进动态，完成回访记录。',
      items: [
        {
          type: 'dispute',
          refId: 'dis-1',
          title: '邻里矛盾回访',
          risk: '中',
          status: '未结',
          assignedToUserId: 'u2',
          assignedToUserName: '王警官',
          deadline: '2025-12-18 18:00',
          requirement: '回访并更新记录，关注情绪波动。',
          priority: '中',
          needVisit: true,
          confirmed: false,
        },
        {
          type: 'task',
          refId: 'task-3',
          title: '江北夜巡',
          risk: '低',
          status: 'pending',
          assignedToUserId: 'u1',
          assignedToUserName: '李警官',
          deadline: '2025-12-18 22:00',
          requirement: '完成夜巡并提交至少1张照片。',
          priority: '低',
          needVisit: false,
          confirmed: true,
        },
      ],
      createdAt: '2025-12-18T00:00:00.000Z',
    },
    {
      shiftId: 'shift-4',
      handoverTime: '2025-12-17 08:00',
      currentShift: 'A组-李警官',
      nextShift: { id: 'u3', name: '张警官' },
      overallRemark: '场所晨曦足浴需复查，关注安全隐患整改。',
      items: [
        {
          type: 'order',
          refId: 'disp-1002',
          title: '派单-晨曦足浴检查',
          risk: '中',
          status: 'pending',
          assignedToUserId: 'u3',
          assignedToUserName: '张警官',
          deadline: '2025-12-17 19:00',
          requirement: '检查隐患并回告整改情况。',
          priority: '中',
          needVisit: false,
          confirmed: false,
        },
        {
          type: 'alert',
          refId: 'inc-2',
          title: '江北报警',
          risk: '中',
          status: '未结',
          assignedToUserId: 'u3',
          assignedToUserName: '张警官',
          deadline: '2025-12-17 18:00',
          requirement: '回告并补录处置经过。',
          priority: '中',
          needVisit: false,
          confirmed: true,
        },
      ],
      createdAt: '2025-12-17T00:00:00.000Z',
    },
    {
      shiftId: 'shift-5',
      handoverTime: '2025-12-16 08:00',
      currentShift: 'B组-王警官',
      nextShift: { id: 'u4', name: '陈警官' },
      overallRemark: '保持与社区对接，重复报警地址需关注。',
      items: [
        {
          type: 'alert',
          refId: 'inc-3',
          title: '龙石噪音警情',
          risk: '低',
          status: '未结',
          assignedToUserId: 'u4',
          assignedToUserName: '陈警官',
          deadline: '2025-12-16 18:00',
          requirement: '联系物业协调并回告。',
          priority: '低',
          needVisit: false,
          confirmed: true,
        },
        {
          type: 'task',
          refId: 'task-1',
          title: '龙石片区巡逻',
          risk: '中',
          status: 'pending',
          assignedToUserId: 'u2',
          assignedToUserName: '王警官',
          deadline: '2025-12-16 20:00',
          requirement: '按路线巡逻并反馈。',
          priority: '中',
          needVisit: false,
          confirmed: false,
        },
      ],
      createdAt: '2025-12-16T00:00:00.000Z',
    },
  ],
  places: [
    {
      placeId: 'pl-1',
      name: '龙井坊KTV',
      address: '龙井路88号',
      area: '一警务区',
      riskLevel: '高',
      focusLevel: '重点',
      ownerName: '赵强',
      ownerPhone: '13800000001',
      businessStatus: '营业',
      visitFreqDays: 7,
      lastVisitAt: '2025-12-18',
      nextVisitDue: '2025-12-25',
      primaryType: 'KTV',
      modules: ['CHESS_CARD'],
    },
    {
      placeId: 'pl-2',
      name: '桂南出租屋',
      address: '桂南小区3栋',
      area: '一警务区',
      riskLevel: '中',
      focusLevel: '关注',
      ownerName: '陈明',
      ownerPhone: '13800000002',
      businessStatus: '营业',
      visitFreqDays: 15,
      lastVisitAt: '2025-12-10',
      nextVisitDue: '2025-12-25',
      primaryType: 'RENTAL',
      modules: [],
    },
    {
      placeId: 'pl-3',
      name: '晨曦足浴',
      address: '解放路26号',
      area: '二警务区',
      riskLevel: '中',
      focusLevel: '重点',
      ownerName: '周琴',
      ownerPhone: '13800000003',
      businessStatus: '营业',
      visitFreqDays: 10,
      lastVisitAt: '2025-12-15',
      nextVisitDue: '2025-12-25',
      primaryType: 'FOOTBATH',
      modules: ['CHESS_CARD'],
    },
    {
      placeId: 'pl-4',
      name: '星河网吧',
      address: '江北街道18号',
      area: '二警务区',
      riskLevel: '高',
      focusLevel: '重点',
      ownerName: '黄涛',
      ownerPhone: '13800000004',
      businessStatus: '营业',
      visitFreqDays: 7,
      lastVisitAt: '2025-12-16',
      nextVisitDue: '2025-12-23',
      primaryType: 'NETBAR',
      modules: [],
    },
    {
      placeId: 'pl-5',
      name: '和顺棋牌室',
      address: '龙石路5号',
      area: '一警务区',
      riskLevel: '低',
      focusLevel: '一般',
      ownerName: '李强',
      ownerPhone: '13800000005',
      businessStatus: '营业',
      visitFreqDays: 20,
      lastVisitAt: '2025-12-05',
      nextVisitDue: '2025-12-25',
      primaryType: 'CHESS_CARD',
      modules: [],
    },
    {
      placeId: 'pl-6',
      name: '星际网吧+台球+棋牌',
      address: '城西工业区12号',
      area: '二警务区',
      riskLevel: '高',
      focusLevel: '重点',
      ownerName: '潘伟',
      ownerPhone: '13800000006',
      businessStatus: '营业',
      visitFreqDays: 7,
      lastVisitAt: '2025-12-17',
      nextVisitDue: '2025-12-24',
      primaryType: 'NETBAR',
      modules: ['BILLIARD', 'CHESS_CARD'],
    },
    {
      placeId: 'pl-7',
      name: '金色KTV',
      address: '江北商业街30号',
      area: '二警务区',
      riskLevel: '中',
      focusLevel: '关注',
      ownerName: '孙丽',
      ownerPhone: '13800000007',
      businessStatus: '营业',
      visitFreqDays: 14,
      lastVisitAt: '2025-12-08',
      nextVisitDue: '2025-12-22',
      primaryType: 'KTV',
      modules: [],
    },
    {
      placeId: 'pl-8',
      name: '桂南网吧',
      address: '桂南市场北门',
      area: '一警务区',
      riskLevel: '中',
      focusLevel: '关注',
      ownerName: '张宁',
      ownerPhone: '13800000008',
      businessStatus: '营业',
      visitFreqDays: 12,
      lastVisitAt: '2025-12-14',
      nextVisitDue: '2025-12-26',
      primaryType: 'NETBAR',
      modules: ['BILLIARD'],
    },
  ],
  placeProfiles: [
    {
      placeId: 'pl-1',
      primaryType: 'KTV',
      primary: {
        businessLicenseNo: 'BL-2020-001',
        businessLicenseDue: '2026-06-30',
        specialLicenseNo: 'SP-2019-088',
        specialLicenseDue: '2025-12-28',
        fireCheckDate: '2025-11-10',
        roomCount: 24,
        businessHours: '18:00-02:00',
        securityCount: 6,
        riskFlags: ['涉黄', '未成年人'],
      },
      modules: {
        CHESS_CARD: {
          mahjongTableCount: 6,
          chessRoomCount: 2,
          riskGambleFlag: true,
          businessHours: '14:00-02:00',
          notes: '',
        },
      },
    },
    {
      placeId: 'pl-2',
      primaryType: 'RENTAL',
      primary: {
        landlord: '陈明',
        recordStatus: '已备案',
        building: '3栋',
        rooms: [
          { roomNo: '301', occupied: true, tenantMasked: '王*', registered: true, checkInAt: '2025-10-01' },
          { roomNo: '302', occupied: true, tenantMasked: '李*', registered: false, checkInAt: '2025-11-12' },
          { roomNo: '303', occupied: false, tenantMasked: '', registered: false, checkInAt: '' },
        ],
      },
      modules: {},
    },
    {
      placeId: 'pl-3',
      primaryType: 'FOOTBATH',
      primary: {
        roomCount: 18,
        staffCount: 22,
        riskPornFlag: true,
        businessHours: '10:00-02:00',
        licenseDue: '2025-12-20',
      },
      modules: {
        CHESS_CARD: {
          mahjongTableCount: 4,
          chessRoomCount: 1,
          riskGambleFlag: false,
          businessHours: '12:00-00:00',
          notes: '',
        },
      },
    },
    {
      placeId: 'pl-4',
      primaryType: 'NETBAR',
      primary: {
        seatCount: 120,
        realNameSystem: '正常',
        minorControl: '严格',
        businessHours: '全天',
        hasCCTV: true,
      },
      modules: {},
    },
    {
      placeId: 'pl-5',
      primaryType: 'CHESS_CARD',
      primary: {
        mahjongTableCount: 12,
        chessRoomCount: 6,
        riskGambleFlag: true,
        businessHours: '12:00-02:00',
      },
      modules: {},
    },
    {
      placeId: 'pl-6',
      primaryType: 'NETBAR',
      primary: {
        seatCount: 200,
        realNameSystem: '正常',
        minorControl: '一般',
        businessHours: '全天',
        hasCCTV: true,
      },
      modules: {
        BILLIARD: {
          tableCount: 10,
          businessHours: '10:00-02:00',
          hasCCTV: true,
          notes: '',
        },
        CHESS_CARD: {
          mahjongTableCount: 8,
          chessRoomCount: 3,
          riskGambleFlag: true,
          businessHours: '14:00-02:00',
          notes: '',
        },
      },
    },
    {
      placeId: 'pl-7',
      primaryType: 'KTV',
      primary: {
        businessLicenseNo: 'BL-2021-072',
        businessLicenseDue: '2026-03-15',
        specialLicenseNo: 'SP-2021-101',
        specialLicenseDue: '2025-12-05',
        fireCheckDate: '2025-10-22',
        roomCount: 18,
        businessHours: '17:00-02:00',
        securityCount: 4,
        riskFlags: ['涉赌'],
      },
      modules: {},
    },
    {
      placeId: 'pl-8',
      primaryType: 'NETBAR',
      primary: {
        seatCount: 80,
        realNameSystem: '异常',
        minorControl: '一般',
        businessHours: '全天',
        hasCCTV: false,
      },
      modules: {
        BILLIARD: {
          tableCount: 4,
          businessHours: '12:00-00:00',
          hasCCTV: false,
          notes: '',
        },
      },
    },
  ],
  placeVisits: [],
  cars: [
    { carId: 'car-1', plateNo: 'GX0001', name: 'Patrol 1', status: 'IDLE', currentOdo: 23540 },
    { carId: 'car-2', plateNo: 'GX0002', name: 'Response', status: 'IN_USE', currentOdo: 17890 },
    { carId: 'car-3', plateNo: 'GX0003', name: 'Support', status: 'MAINTAIN', currentOdo: 41200 },
    { carId: 'car-4', plateNo: 'GX0004', name: 'Duty', status: 'IDLE', currentOdo: 9650 },
  ],
  carUseLogs: [],
  policeDetails: [
    {
      id: 'police-1',
      title: '警情一',
      caseNo: 'JJ202508210836',
      description: '群众报警称发生纠纷，需要民警到场处置。',
      reporter: '张某',
      phone: '123456789',
      address: 'XX市XX区XX街道XX小区3栋1单元',
      receiveTime: '2025-08-01 10:06',
    },
  ],
  venueDetails: [
    {
      id: 'ktv-1',
      type: 'KTV',
      name: '龙井坊KTV',
      owner: { name: '张三', phone: '123456789' },
      manager: { name: '李四', phone: '1855522365' },
      address: 'XX市XX区XX街道XX小区3栋1单元',
      lastCheckTime: '2025-08-01 10:06',
      tags: [{ tag: '重点场所' }],
      checkRecords: [],
      staffList: [],
      archiveList: [],
    },
  ],
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensure(key, fallback) {
  const cached = uni.getStorageSync(key);
  if (cached && Array.isArray(cached)) return cached;
  uni.setStorageSync(key, clone(fallback));
  return clone(fallback);
}

// Generic getters
export const getVehicles = () => ensure(KEYS.vehicles, defaults.vehicles);
export const saveVehicles = (list) => uni.setStorageSync(KEYS.vehicles, list);

export const getHistory = () => ensure(KEYS.history, defaults.history);
export const saveHistory = (list) => uni.setStorageSync(KEYS.history, list);

export const getApprovals = () => ensure(KEYS.approvals, defaults.approvals);
export const saveApprovals = (list) => uni.setStorageSync(KEYS.approvals, list);

export const getMetrics = () => ensure(KEYS.metrics, defaults.metrics);
export const saveMetrics = (list) => uni.setStorageSync(KEYS.metrics, list);

export const getTodos = () => ensure(KEYS.todos, defaults.todos);
export const saveTodos = (list) => uni.setStorageSync(KEYS.todos, list);

export const getShortcuts = () => ensure(KEYS.shortcuts, defaults.shortcuts);
export const saveShortcuts = (list) => uni.setStorageSync(KEYS.shortcuts, list);

export const getChatMessages = () => ensure(KEYS.chat, defaults.chat);
export const saveChatMessages = (list) => uni.setStorageSync(KEYS.chat, list);

export const getSceneItems = () => ensure(KEYS.scene, defaults.scene);
export const saveSceneItems = (list) => uni.setStorageSync(KEYS.scene, list);

export const getDisposeItems = () => ensure(KEYS.dispose, defaults.dispose);
export const saveDisposeItems = (list) => uni.setStorageSync(KEYS.dispose, list);

export const getDispatches = () => ensure(KEYS.dispatches, defaults.dispatches);
export const saveDispatches = (list) => uni.setStorageSync(KEYS.dispatches, list);

export const getTasks = () => ensure(KEYS.tasks, defaults.tasks);
export const saveTasks = (list) => uni.setStorageSync(KEYS.tasks, list);

export const getDisputes = () => ensure(KEYS.disputes, defaults.disputes);
export const saveDisputes = (list) => uni.setStorageSync(KEYS.disputes, list);

export const getKeyPlaces = () => ensure(KEYS.keyPlaces, defaults.keyPlaces);
export const saveKeyPlaces = (list) => uni.setStorageSync(KEYS.keyPlaces, list);

export const getKeyPersons = () => ensure(KEYS.keyPersons, defaults.keyPersons);
export const saveKeyPersons = (list) => uni.setStorageSync(KEYS.keyPersons, list);

export const getPatrolPoints = () => ensure(KEYS.patrolPoints, defaults.patrolPoints);
export const savePatrolPoints = (list) => uni.setStorageSync(KEYS.patrolPoints, list);

export const getIncidents = () => ensure(KEYS.incidents, defaults.incidents);
export const saveIncidents = (list) => uni.setStorageSync(KEYS.incidents, list);

export const getShifts = () => ensure(KEYS.shifts, defaults.shifts);
export const saveShifts = (list) => uni.setStorageSync(KEYS.shifts, list);

export const getPlaces = () => ensure(KEYS.places, defaults.places);
export const savePlaces = (list) => uni.setStorageSync(KEYS.places, list);

export const getPlaceProfiles = () => ensure(KEYS.placeProfiles, defaults.placeProfiles);
export const savePlaceProfiles = (list) => uni.setStorageSync(KEYS.placeProfiles, list);

export const getPlaceVisits = () => ensure(KEYS.placeVisits, defaults.placeVisits);
export const savePlaceVisits = (list) => uni.setStorageSync(KEYS.placeVisits, list);

export const getCars = () => ensure(KEYS.cars, defaults.cars);
export const saveCars = (list) => uni.setStorageSync(KEYS.cars, list);

export const getCarUseLogs = () => ensure(KEYS.carUseLogs, defaults.carUseLogs);
export const saveCarUseLogs = (list) => uni.setStorageSync(KEYS.carUseLogs, list);

export const getPoliceDetails = () => ensure(KEYS.policeDetails, defaults.policeDetails);
export const savePoliceDetails = (list) => uni.setStorageSync(KEYS.policeDetails, list);
export const getPoliceDetailById = (id) => getPoliceDetails().find((item) => item.id === id);

export const getVenueDetails = () => ensure(KEYS.venueDetails, defaults.venueDetails);
export const saveVenueDetails = (list) => uni.setStorageSync(KEYS.venueDetails, list);
export const getVenueDetailById = (id) => getVenueDetails().find((item) => item.id === id);

// Place helpers
export const getPlaceById = (placeId) => getPlaces().find((p) => p.placeId === placeId);
export const getProfileByPlaceId = (placeId) => getPlaceProfiles().find((p) => p.placeId === placeId);

export function updatePlace(place) {
  const list = getPlaces().map((p) => (p.placeId === place.placeId ? place : p));
  savePlaces(list);
  return list;
}

export function updateProfile(placeId, patch) {
  const list = getPlaceProfiles().map((p) => {
    if (p.placeId !== placeId) return p;
    return {
      ...p,
      ...patch,
      primary: { ...p.primary, ...(patch.primary || {}) },
      modules: { ...p.modules, ...(patch.modules || {}) },
    };
  });
  savePlaceProfiles(list);
  return list;
}

// Vehicle helpers
export const getVehicleById = (id) => getVehicles().find((v) => v.id === id);

export const getLastEndMileage = (vehicleId) => {
  const history = getHistory().find((h) => h.vehicleId === vehicleId);
  const vehicle = getVehicleById(vehicleId);
  return history?.endMileage || vehicle?.mileage || 0;
};

export const getActiveRecord = (vehicleId) =>
  getHistory().find((h) => h.vehicleId === vehicleId && h.status === 'in_use');

export function addRegistration(record) {
  const approvals = [{ ...record, status: 'in_use', endMileage: null }, ...getApprovals()];
  const history = [{ ...record, status: 'in_use', endMileage: null }, ...getHistory()];
  const vehicles = getVehicles().map((v) =>
    v.id === record.vehicleId
      ? { ...v, mileage: record.startMileage || v.mileage, status: 'in_use', occupant: record.applicant }
      : v
  );
  saveApprovals(approvals);
  saveHistory(history);
  saveVehicles(vehicles);
  return { approvals, history, vehicles };
}

export function endUse(vehicleId, endMileage) {
  const approvals = getApprovals();
  const history = getHistory();
  const vehicles = getVehicles();

  const historyIdx = history.findIndex((h) => h.vehicleId === vehicleId && h.status === 'in_use');
  if (historyIdx >= 0) {
    history[historyIdx] = {
      ...history[historyIdx],
      endMileage,
      status: 'completed',
      comment: history[historyIdx].comment || '使用结束',
    };
    const approvalIdx = approvals.findIndex((a) => a.id === history[historyIdx].id);
    if (approvalIdx >= 0) {
      approvals[approvalIdx] = {
        ...approvals[approvalIdx],
        status: 'completed',
        endMileage,
        comment: approvals[approvalIdx].comment || '使用结束',
      };
    }
  }

  const vehicleIdx = vehicles.findIndex((v) => v.id === vehicleId);
  if (vehicleIdx >= 0) {
    vehicles[vehicleIdx] = {
      ...vehicles[vehicleIdx],
      status: 'idle',
      occupant: '',
      mileage: endMileage,
    };
  }

  saveVehicles(vehicles);
  saveHistory(history);
  saveApprovals(approvals);
  return { approvals, history, vehicles };
}

// Chat helpers
export function addChatMessage(payload) {
  const list = getChatMessages();
  list.push(payload);
  saveChatMessages(list);
  return list;
}

// Scene helpers
export function addSceneItem(item) {
  const list = [item, ...getSceneItems()];
  saveSceneItems(list);
  return list;
}

// Dispose helpers
export function addDisposeItem(item) {
  const list = [item, ...getDisposeItems()];
  saveDisposeItems(list);
  return list;
}

// Dispatch helpers
export function addDispatch(record) {
  const list = [record, ...getDispatches()];
  saveDispatches(list);
  return list;
}

// Car helpers
export const getOpenLogByCarId = (carId) =>
  getCarUseLogs().find((log) => log.carId === carId && log.status === 'OPEN');

export const getOpenLogByUserId = (userId) =>
  getCarUseLogs().find((log) => log.userId === userId && log.status === 'OPEN');
