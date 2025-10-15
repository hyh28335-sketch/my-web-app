from flask import Flask, jsonify, request, Response, stream_template, session, redirect, url_for
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import json
from dotenv import load_dotenv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
import secrets

import time

# 加载环境变量
load_dotenv()

# 创建Flask应用
app = Flask(__name__)

# 配置CORS，允许前端跨域访问
# 生产环境需要配置实际的前端域名
allowed_origins = [
    'http://localhost:3000',  # Next.js前端
    'http://localhost:5173',  # 开发环境
    'https://*.vercel.app',   # Vercel部署
    'https://*.netlify.app',  # Netlify部署
    'https://*.github.io',    # GitHub Pages
]

# 从环境变量获取允许的域名
if os.getenv('FRONTEND_URL'):
    allowed_origins.append(os.getenv('FRONTEND_URL'))

CORS(app, origins=allowed_origins, supports_credentials=True)

# 配置SQLite数据库
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "notes.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# 初始化数据库
db = SQLAlchemy(app)



# 笔记数据模型
class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, default='无标题')
    content = db.Column(db.Text, nullable=False, default='')
    tags = db.Column(db.Text, default='[]')  # JSON字符串存储标签
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# 待办事项数据模型
class Todo(db.Model):
    __tablename__ = 'todos'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ChatConversation模型已删除

# ChatMessage模型已删除

# 项目数据模型
class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    status = db.Column(db.String(20), default='active')  # active, completed, archived
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联任务
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """转换为字典格式"""
        # 计算统计信息
        total_tasks = len(self.tasks)
        completed_tasks = len([task for task in self.tasks if task.status == 'done'])
        in_progress_tasks = len([task for task in self.tasks if task.status == 'in_progress'])
        todo_tasks = len([task for task in self.tasks if task.status == 'todo'])
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'stats': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'todo_tasks': todo_tasks
            }
        }

# 任务数据模型
class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    status = db.Column(db.String(20), default='todo')  # todo, in_progress, done
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    assignee = db.Column(db.String(100), default='')
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外键关联项目
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'assignee': self.assignee,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'project_id': self.project_id
        }

# API路由

@app.route('/', methods=['GET'])
def index():
    """根路径 - API文档和服务信息"""
    return jsonify({
        'service': 'AI智能记事本后端API',
        'version': '1.0.0',
        'status': 'running',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': {
            'health': '/api/health',
            'notes': '/api/notes',
            'todos': '/api/todos', 
            'projects': '/api/projects',
            'tasks': '/api/tasks',
            'search': '/api/search',
            'chat': '/api/chat',
            'models': '/api/models'
        },
        'documentation': {
            'notes': {
                'GET /api/notes': '获取所有笔记',
                'POST /api/notes': '创建笔记',
                'GET /api/notes/<id>': '获取单个笔记',
                'PUT /api/notes/<id>': '更新笔记',
                'DELETE /api/notes/<id>': '删除笔记'
            },
            'todos': {
                'GET /api/todos': '获取所有待办事项',
                'POST /api/todos': '创建待办事项',
                'GET /api/todos/<id>': '获取单个待办事项',
                'PUT /api/todos/<id>': '更新待办事项',
                'DELETE /api/todos/<id>': '删除待办事项'
            },
            'ai': {
                'POST /api/chat': 'AI聊天对话',
                'GET /api/models': '获取可用AI模型',
                'POST /api/search': '智能搜索笔记'
            }
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'message': '智能记事本后端服务运行正常',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/notes', methods=['GET'])
def get_notes():
    """获取所有笔记"""
    try:
        notes = Note.query.order_by(Note.updated_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [note.to_dict() for note in notes]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/notes', methods=['POST'])
def create_note():
    """创建新笔记"""
    try:
        data = request.get_json()
        
        note = Note(
            title=data.get('title', '无标题'),
            content=data.get('content', ''),
            tags=json.dumps(data.get('tags', []), ensure_ascii=False)
        )
        
        db.session.add(note)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': note.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    """获取单个笔记"""
    try:
        note = Note.query.get_or_404(note_id)
        return jsonify({
            'success': True,
            'data': note.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """更新笔记"""
    try:
        note = Note.query.get_or_404(note_id)
        data = request.get_json()
        
        if 'title' in data:
            note.title = data['title']
        if 'content' in data:
            note.content = data['content']
        if 'tags' in data:
            note.tags = json.dumps(data['tags'], ensure_ascii=False)
            
        note.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': note.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """删除笔记"""
    try:
        note = Note.query.get_or_404(note_id)
        db.session.delete(note)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '笔记已删除'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# 待办事项API路由

@app.route('/api/todos', methods=['GET'])
def get_todos():
    """获取所有待办事项"""
    try:
        todos = Todo.query.order_by(Todo.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [todo.to_dict() for todo in todos]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos', methods=['POST'])
def create_todo():
    """创建新待办事项"""
    try:
        data = request.get_json()
        
        # 处理due_date
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except:
                pass
        
        todo = Todo(
            title=data.get('title', ''),
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            due_date=due_date
        )
        
        db.session.add(todo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': todo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    """获取单个待办事项"""
    try:
        todo = Todo.query.get_or_404(todo_id)
        return jsonify({
            'success': True,
            'data': todo.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """更新待办事项"""
    try:
        todo = Todo.query.get_or_404(todo_id)
        data = request.get_json()
        
        # 更新字段
        if 'title' in data:
            todo.title = data['title']
        if 'description' in data:
            todo.description = data['description']
        if 'completed' in data:
            todo.completed = data['completed']
        if 'priority' in data:
            todo.priority = data['priority']
        if 'due_date' in data:
            if data['due_date']:
                try:
                    todo.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except:
                    pass
            else:
                todo.due_date = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': todo.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """删除待办事项"""
    try:
        todo = Todo.query.get_or_404(todo_id)
        db.session.delete(todo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '待办事项已删除'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# 项目管理API路由

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """获取所有项目"""
    try:
        projects = Project.query.order_by(Project.updated_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [project.to_dict() for project in projects]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    """创建新项目"""
    try:
        data = request.get_json()
        
        # 处理日期
        start_date = None
        end_date = None
        if data.get('start_date'):
            try:
                start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            except:
                pass
        if data.get('end_date'):
            try:
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            except:
                pass
        
        project = Project(
            title=data.get('title', ''),
            description=data.get('description', ''),
            status=data.get('status', 'active'),
            priority=data.get('priority', 'medium'),
            start_date=start_date,
            end_date=end_date
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """获取单个项目"""
    try:
        project = Project.query.get_or_404(project_id)
        return jsonify({
            'success': True,
            'data': project.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """更新项目"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        # 更新字段
        if 'title' in data:
            project.title = data['title']
        if 'description' in data:
            project.description = data['description']
        if 'status' in data:
            project.status = data['status']
        if 'priority' in data:
            project.priority = data['priority']
        if 'start_date' in data:
            if data['start_date']:
                try:
                    project.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
                except:
                    pass
            else:
                project.start_date = None
        if 'end_date' in data:
            if data['end_date']:
                try:
                    project.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
                except:
                    pass
            else:
                project.end_date = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """删除项目"""
    try:
        project = Project.query.get_or_404(project_id)
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '项目已删除'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/projects/<int:project_id>/tasks', methods=['GET'])
def get_project_tasks(project_id):
    """获取项目的所有任务"""
    try:
        project = Project.query.get_or_404(project_id)
        tasks = Task.query.filter_by(project_id=project_id).order_by(Task.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [task.to_dict() for task in tasks]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """创建新任务"""
    try:
        data = request.get_json()
        
        # 验证项目是否存在
        project_id = data.get('project_id')
        if not project_id:
            return jsonify({
                'success': False,
                'error': '项目ID不能为空'
            }), 400
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                'success': False,
                'error': '项目不存在'
            }), 404
        
        # 处理日期
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except:
                pass
        
        task = Task(
            title=data.get('title', ''),
            description=data.get('description', ''),
            status=data.get('status', 'todo'),
            priority=data.get('priority', 'medium'),
            assignee=data.get('assignee', ''),
            due_date=due_date,
            project_id=project_id
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': task.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """获取单个任务"""
    try:
        task = Task.query.get_or_404(task_id)
        return jsonify({
            'success': True,
            'data': task.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """更新任务"""
    try:
        task = Task.query.get_or_404(task_id)
        data = request.get_json()
        
        # 更新字段
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'status' in data:
            task.status = data['status']
        if 'priority' in data:
            task.priority = data['priority']
        if 'assignee' in data:
            task.assignee = data['assignee']
        if 'due_date' in data:
            if data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except:
                    pass
            else:
                task.due_date = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': task.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """删除任务"""
    try:
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '任务已删除'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/search', methods=['POST'])
def search_notes():
    """搜索笔记 - 基础全文搜索"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({
                'success': False,
                'error': '搜索关键词不能为空'
            }), 400
        
        # 使用数据库LIKE搜索
        notes = Note.query.filter(
            db.or_(
                Note.title.contains(query),
                Note.content.contains(query)
            )
        ).order_by(Note.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [note.to_dict() for note in notes],
            'total': len(notes),
            'search_type': 'basic'
        })
        
    except Exception as e:
        print(f"搜索错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/knowledge-search', methods=['POST'])
def knowledge_search():
    """知识库综合搜索 - 搜索所有相关数据"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        search_types = data.get('types', ['notes', 'projects', 'tasks', 'todos'])  # 默认搜索所有类型
        limit = data.get('limit', 20)  # 每种类型的最大结果数
        
        if not query:
            return jsonify({
                'success': False,
                'error': '搜索关键词不能为空'
            }), 400
        
        results = {}
        total_count = 0
        
        # 搜索笔记
        if 'notes' in search_types:
            notes = Note.query.filter(
                db.or_(
                    Note.title.contains(query),
                    Note.content.contains(query),
                    Note.tags.contains(query)
                )
            ).order_by(Note.updated_at.desc()).limit(limit).all()
            
            results['notes'] = {
                'data': [note.to_dict() for note in notes],
                'count': len(notes),
                'type': 'notes'
            }
            total_count += len(notes)
        
        # 搜索项目
        if 'projects' in search_types:
            projects = Project.query.filter(
                db.or_(
                    Project.title.contains(query),
                    Project.description.contains(query)
                )
            ).order_by(Project.updated_at.desc()).limit(limit).all()
            
            results['projects'] = {
                'data': [project.to_dict() for project in projects],
                'count': len(projects),
                'type': 'projects'
            }
            total_count += len(projects)
        
        # 搜索任务
        if 'tasks' in search_types:
            tasks = Task.query.filter(
                db.or_(
                    Task.title.contains(query),
                    Task.description.contains(query),
                    Task.assignee.contains(query)
                )
            ).order_by(Task.updated_at.desc()).limit(limit).all()
            
            results['tasks'] = {
                'data': [task.to_dict() for task in tasks],
                'count': len(tasks),
                'type': 'tasks'
            }
            total_count += len(tasks)
        
        # 搜索待办事项
        if 'todos' in search_types:
            todos = Todo.query.filter(
                db.or_(
                    Todo.title.contains(query),
                    Todo.description.contains(query)
                )
            ).order_by(Todo.updated_at.desc()).limit(limit).all()
            
            results['todos'] = {
                'data': [todo.to_dict() for todo in todos],
                'count': len(todos),
                'type': 'todos'
            }
            total_count += len(todos)
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'total_count': total_count,
            'search_types': search_types,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"知识库搜索错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/knowledge-context', methods=['POST'])
def get_knowledge_context():
    """获取知识库上下文 - 为AI提供相关背景信息"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        context_limit = data.get('limit', 10)  # 每种类型的上下文数量
        
        if not query:
            return jsonify({
                'success': False,
                'error': '查询内容不能为空'
            }), 400
        
        context = {
            'query': query,
            'timestamp': datetime.utcnow().isoformat(),
            'data': {}
        }
        
        # 获取相关笔记
        relevant_notes = Note.query.filter(
            db.or_(
                Note.title.contains(query),
                Note.content.contains(query),
                Note.tags.contains(query)
            )
        ).order_by(Note.updated_at.desc()).limit(context_limit).all()
        
        context['data']['notes'] = [
            {
                'id': note.id,
                'title': note.title,
                'content': note.content[:500] + '...' if len(note.content) > 500 else note.content,
                'tags': note.tags,
                'updated_at': note.updated_at.isoformat() if note.updated_at else None
            }
            for note in relevant_notes
        ]
        
        # 获取相关项目
        relevant_projects = Project.query.filter(
            db.or_(
                Project.title.contains(query),
                Project.description.contains(query)
            )
        ).order_by(Project.updated_at.desc()).limit(context_limit).all()
        
        context['data']['projects'] = [
            {
                'id': project.id,
                'title': project.title,
                'description': project.description[:300] + '...' if len(project.description) > 300 else project.description,
                'status': project.status,
                'priority': project.priority,
                'stats': project.to_dict()['stats']
            }
            for project in relevant_projects
        ]
        
        # 获取相关任务
        relevant_tasks = Task.query.filter(
            db.or_(
                Task.title.contains(query),
                Task.description.contains(query),
                Task.assignee.contains(query)
            )
        ).order_by(Task.updated_at.desc()).limit(context_limit).all()
        
        context['data']['tasks'] = [
            {
                'id': task.id,
                'title': task.title,
                'description': task.description[:200] + '...' if len(task.description) > 200 else task.description,
                'status': task.status,
                'priority': task.priority,
                'project_id': task.project_id
            }
            for task in relevant_tasks
        ]
        
        # 获取相关待办事项
        relevant_todos = Todo.query.filter(
            db.or_(
                Todo.title.contains(query),
                Todo.description.contains(query)
            )
        ).order_by(Todo.updated_at.desc()).limit(context_limit).all()
        
        context['data']['todos'] = [
            {
                'id': todo.id,
                'title': todo.title,
                'description': todo.description[:200] + '...' if len(todo.description) > 200 else todo.description,
                'completed': todo.completed,
                'priority': todo.priority,
                'due_date': todo.due_date.isoformat() if todo.due_date else None
            }
            for todo in relevant_todos
        ]
        
        # 计算总的相关项目数
        total_items = len(context['data']['notes']) + len(context['data']['projects']) + len(context['data']['tasks']) + len(context['data']['todos'])
        context['total_items'] = total_items
        
        return jsonify({
            'success': True,
            'context': context
        })
        
    except Exception as e:
        print(f"获取知识库上下文错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/models', methods=['GET'])
def get_available_models():
    """获取可用的AI模型列表"""
    models = {
        "claude-3.5-sonnet": {
            "name": "Claude 3.5 Sonnet",
            "provider": "Anthropic",
            "description": "最新的Claude模型，擅长复杂推理和创作",
            "recommended": True
        },
        "claude-3-opus": {
            "name": "Claude 3 Opus",
            "provider": "Anthropic", 
            "description": "Claude最强大的模型，适合复杂任务",
            "recommended": False
        },
        "claude-3-haiku": {
            "name": "Claude 3 Haiku",
            "provider": "Anthropic",
            "description": "快速响应的Claude模型",
            "recommended": False
        },
        "gpt-4o": {
            "name": "GPT-4o",
            "provider": "OpenAI",
            "description": "OpenAI最新的多模态模型",
            "recommended": True
        },
        "gpt-4-turbo": {
            "name": "GPT-4 Turbo", 
            "provider": "OpenAI",
            "description": "高性能的GPT-4模型",
            "recommended": False
        },
        "gemini-pro": {
            "name": "Gemini Pro",
            "provider": "Google",
            "description": "Google的高性能AI模型",
            "recommended": False
        },
        "llama-3.1-405b": {
            "name": "Llama 3.1 405B",
            "provider": "Meta",
            "description": "Meta最大的开源模型",
            "recommended": False
        },
        "qwen-2.5-72b": {
            "name": "Qwen 2.5 72B",
            "provider": "Alibaba",
            "description": "阿里巴巴的高性能中文模型",
            "recommended": False
        }
    }
    
    return jsonify({
        'success': True,
        'models': models
    })

@app.route('/api/google-search', methods=['POST'])
def google_search():
    """Google搜索接口"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'error': '搜索关键词不能为空'}), 400
        
        # 模拟Google搜索结果（实际项目中需要使用Google Custom Search API）
        # 这里提供一些示例结果
        mock_results = [
            {
                'title': f'{query} - 维基百科',
                'url': f'https://zh.wikipedia.org/wiki/{query}',
                'snippet': f'关于{query}的详细介绍和相关信息。维基百科是一个自由的百科全书，包含了丰富的知识内容。',
                'displayUrl': 'zh.wikipedia.org'
            },
            {
                'title': f'{query} 相关资讯 - 百度百科',
                'url': f'https://baike.baidu.com/item/{query}',
                'snippet': f'{query}的基本概念、发展历史、应用领域等详细信息。百度百科提供权威、准确的知识内容。',
                'displayUrl': 'baike.baidu.com'
            },
            {
                'title': f'{query} 最新动态 - 知乎',
                'url': f'https://www.zhihu.com/search?q={query}',
                'snippet': f'关于{query}的专业讨论和深度分析。知乎汇聚了各领域专家的见解和经验分享。',
                'displayUrl': 'www.zhihu.com'
            },
            {
                'title': f'{query} 技术文档 - GitHub',
                'url': f'https://github.com/search?q={query}',
                'snippet': f'与{query}相关的开源项目和代码示例。GitHub是全球最大的代码托管平台。',
                'displayUrl': 'github.com'
            },
            {
                'title': f'{query} 学习资源 - CSDN',
                'url': f'https://so.csdn.net/so/search?q={query}',
                'snippet': f'{query}的技术教程、实践案例和解决方案。CSDN是专业的IT技术社区。',
                'displayUrl': 'blog.csdn.net'
            }
        ]
        
        return jsonify({
            'success': True,
            'query': query,
            'results': mock_results,
            'total': len(mock_results),
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f'Google搜索接口出错: {str(e)}')
        return jsonify({'error': '搜索服务暂时不可用'}), 500

# Google OAuth配置
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid_configuration"

# OAuth流程配置
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # 仅用于开发环境

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """处理Google OAuth登录"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': '缺少访问令牌'}), 400
            
        if not GOOGLE_CLIENT_ID:
            return jsonify({'error': 'Google OAuth未配置'}), 500
        
        # 验证Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), GOOGLE_CLIENT_ID
            )
            
            # 获取用户信息
            user_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo['name']
            picture = idinfo.get('picture', '')
            
            # 生成会话token
            session_token = secrets.token_urlsafe(32)
            
            # 这里可以将用户信息保存到数据库
            # 目前先返回用户信息
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'picture': picture
                },
                'token': session_token
            })
            
        except ValueError as e:
            print(f'Token验证失败: {e}')
            return jsonify({'error': '无效的访问令牌'}), 401
            
    except Exception as e:
        print(f'Google OAuth错误: {e}')
        return jsonify({'error': '登录失败'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """用户登出"""
    try:
        # 清除会话信息
        session.clear()
        
        return jsonify({
            'success': True,
            'message': '已成功登出'
        })
        
    except Exception as e:
        print(f'登出错误: {e}')
        return jsonify({'error': '登出失败'}), 500

@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    """获取当前登录用户信息"""
    try:
        # 从请求头获取token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': '未授权'}), 401
            
        token = auth_header.split(' ')[1]
        
        # 这里应该验证token并返回用户信息
        # 目前先返回模拟数据
        return jsonify({
            'success': True,
            'user': {
                'id': 'mock_user_id',
                'email': 'user@example.com',
                'name': '用户',
                'picture': ''
            }
        })
        
    except Exception as e:
        print(f'获取用户信息错误: {e}')
        return jsonify({'error': '获取用户信息失败'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """AI聊天接口 - 使用OpenRouter API，集成知识库搜索"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        history = data.get('history', [])
        model = data.get('model', 'claude-3.5-sonnet')  # 默认使用Claude 3.5 Sonnet
        use_knowledge_base = data.get('use_knowledge_base', True)  # 默认启用知识库
        
        if not message:
            return jsonify({'error': '消息不能为空'}), 400
        
        # 获取OpenRouter API密钥
        openrouter_api_key = os.getenv('OPENROUTE_API_KEY')
        if not openrouter_api_key:
            return jsonify({'error': 'OpenRouter API密钥未配置'}), 500
        
        # 搜索知识库获取相关上下文
        knowledge_context = None
        if use_knowledge_base:
            try:
                knowledge_context = search_knowledge_base(message)
            except Exception as e:
                print(f"知识库搜索失败: {e}")
                # 即使知识库搜索失败，也继续处理聊天请求
        
        # 调用OpenRouter API
        response_text = call_openrouter_api(message, history, openrouter_api_key, model, knowledge_context)
        
        return jsonify({
            'response': response_text,
            'timestamp': datetime.utcnow().isoformat(),
            'knowledge_used': knowledge_context is not None and knowledge_context['total_items'] > 0
        })
        
    except Exception as e:
        print(f'聊天接口出错: {str(e)}')
        return jsonify({'error': '聊天服务暂时不可用'}), 500

def search_knowledge_base(query, limit=5):
    """搜索知识库获取相关上下文"""
    try:
        context = {
            'query': query,
            'timestamp': datetime.utcnow().isoformat(),
            'data': {}
        }
        
        # 获取相关笔记
        relevant_notes = Note.query.filter(
            db.or_(
                Note.title.contains(query),
                Note.content.contains(query),
                Note.tags.contains(query)
            )
        ).order_by(Note.updated_at.desc()).limit(limit).all()
        
        context['data']['notes'] = [
            {
                'id': note.id,
                'title': note.title,
                'content': note.content[:800] + '...' if len(note.content) > 800 else note.content,
                'tags': note.tags,
                'updated_at': note.updated_at.isoformat() if note.updated_at else None
            }
            for note in relevant_notes
        ]
        
        # 获取相关项目
        relevant_projects = Project.query.filter(
            db.or_(
                Project.title.contains(query),
                Project.description.contains(query)
            )
        ).order_by(Project.updated_at.desc()).limit(limit).all()
        
        context['data']['projects'] = [
            {
                'id': project.id,
                'title': project.title,
                'description': project.description[:400] + '...' if len(project.description) > 400 else project.description,
                'status': project.status,
                'priority': project.priority,
                'stats': project.to_dict()['stats']
            }
            for project in relevant_projects
        ]
        
        # 获取相关任务
        relevant_tasks = Task.query.filter(
            db.or_(
                Task.title.contains(query),
                Task.description.contains(query),
                Task.assignee.contains(query)
            )
        ).order_by(Task.updated_at.desc()).limit(limit).all()
        
        context['data']['tasks'] = [
            {
                'id': task.id,
                'title': task.title,
                'description': task.description[:300] + '...' if len(task.description) > 300 else task.description,
                'status': task.status,
                'priority': task.priority,
                'project_id': task.project_id
            }
            for task in relevant_tasks
        ]
        
        # 获取相关待办事项
        relevant_todos = Todo.query.filter(
            db.or_(
                Todo.title.contains(query),
                Todo.description.contains(query)
            )
        ).order_by(Todo.updated_at.desc()).limit(limit).all()
        
        context['data']['todos'] = [
            {
                'id': todo.id,
                'title': todo.title,
                'description': todo.description[:300] + '...' if len(todo.description) > 300 else todo.description,
                'completed': todo.completed,
                'priority': todo.priority,
                'due_date': todo.due_date.isoformat() if todo.due_date else None
            }
            for todo in relevant_todos
        ]
        
        # 计算总的相关项目数
        total_items = len(context['data']['notes']) + len(context['data']['projects']) + len(context['data']['tasks']) + len(context['data']['todos'])
        context['total_items'] = total_items
        
        return context if total_items > 0 else None
        
    except Exception as e:
        print(f"搜索知识库时出错: {e}")
        return None

def call_openrouter_api(message, history, api_key, model_name=None, knowledge_context=None):
    """调用OpenRouter API获取AI回复"""
    import requests
    
    # OpenRouter支持的高质量模型列表
    available_models = {
        "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
        "claude-3-opus": "anthropic/claude-3-opus",
        "claude-3-haiku": "anthropic/claude-3-haiku",
        "gpt-4o": "openai/gpt-4o",
        "gpt-4-turbo": "openai/gpt-4-turbo",
        "gemini-pro": "google/gemini-pro",
        "llama-3.1-405b": "meta-llama/llama-3.1-405b-instruct",
        "qwen-2.5-72b": "qwen/qwen-2.5-72b-instruct"
    }
    
    # 选择模型（默认使用Claude 3.5 Sonnet）
    selected_model = available_models.get(model_name, "anthropic/claude-3.5-sonnet")
    
    # OpenRouter API配置
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",  # 你的应用URL
        "X-Title": "AI Notebook"  # 你的应用名称（使用英文避免编码问题）
    }
    
    # 构建消息历史
    messages = []
    
    # 构建系统提示，根据是否有知识库上下文进行调整
    base_system_prompt = """你是一个高级AI助手，具备强大的知识库和推理能力。你的任务是：

1. **直接回答问题**：提供准确、详细、有用的答案，而不是仅仅给出建议
2. **深度分析**：对复杂问题进行深入分析和解释
3. **多角度思考**：从不同角度考虑问题，提供全面的见解
4. **实用建议**：在回答问题的同时，提供可行的解决方案
5. **知识整合**：结合相关知识点，提供有价值的补充信息

请用中文回复，保持友善、专业的语气。如果遇到不确定的信息，请明确说明。"""
    
    # 如果有知识库上下文，添加相关信息
    if knowledge_context and knowledge_context.get('total_items', 0) > 0:
        context_info = "\n\n**重要：我已经为你搜索了用户的个人知识库，以下是相关信息：**\n\n"
        
        # 添加笔记信息
        if knowledge_context['data'].get('notes'):
            context_info += "**相关笔记：**\n"
            for note in knowledge_context['data']['notes']:
                context_info += f"- 标题：{note['title']}\n"
                context_info += f"  内容：{note['content']}\n"
                if note['tags'] and note['tags'] != '[]':
                    context_info += f"  标签：{note['tags']}\n"
                context_info += "\n"
        
        # 添加项目信息
        if knowledge_context['data'].get('projects'):
            context_info += "**相关项目：**\n"
            for project in knowledge_context['data']['projects']:
                context_info += f"- 项目：{project['title']}\n"
                context_info += f"  描述：{project['description']}\n"
                context_info += f"  状态：{project['status']} | 优先级：{project['priority']}\n"
                stats = project.get('stats', {})
                context_info += f"  任务统计：总计{stats.get('total_tasks', 0)}个，已完成{stats.get('completed_tasks', 0)}个\n\n"
        
        # 添加任务信息
        if knowledge_context['data'].get('tasks'):
            context_info += "**相关任务：**\n"
            for task in knowledge_context['data']['tasks']:
                context_info += f"- 任务：{task['title']}\n"
                context_info += f"  描述：{task['description']}\n"
                context_info += f"  状态：{task['status']} | 优先级：{task['priority']}\n\n"
        
        # 添加待办事项信息
        if knowledge_context['data'].get('todos'):
            context_info += "**相关待办事项：**\n"
            for todo in knowledge_context['data']['todos']:
                status = "已完成" if todo['completed'] else "未完成"
                context_info += f"- 待办：{todo['title']}\n"
                context_info += f"  描述：{todo['description']}\n"
                context_info += f"  状态：{status} | 优先级：{todo['priority']}\n\n"
        
        context_info += "**请基于以上用户的个人信息来回答问题，提供个性化和具体的建议。如果问题与这些信息相关，请直接引用和分析这些内容。**"
        
        system_prompt = base_system_prompt + context_info
    else:
        system_prompt = base_system_prompt
    
    # 添加系统提示
    messages.append({
        "role": "system", 
        "content": system_prompt
    })
    
    # 添加历史对话（最近10条）
    if history:
        for item in history[-10:]:  # 只保留最近10条对话
            if item.get('type') == 'user':
                messages.append({"role": "user", "content": item.get('content', '')})
            elif item.get('type') == 'assistant':
                messages.append({"role": "assistant", "content": item.get('content', '')})
    
    # 添加当前用户消息
    messages.append({"role": "user", "content": message})
    
    # API请求数据 - 使用OpenRouter的高质量模型
    data = {
        "model": selected_model,  # 使用动态选择的模型
        "messages": messages,
        "max_tokens": 2000,  # 增加最大token数以获得更详细的回答
        "temperature": 0.7,  # 保持适度的创造性
        "top_p": 0.9,  # 优化采样策略
        "frequency_penalty": 0.1,  # 轻微减少重复
        "presence_penalty": 0.1,  # 鼓励话题多样性
        "stream": False  # 确保获得完整回复
    }
    
    try:
        print(f"发送请求到OpenRouter API...")
        print(f"请求URL: {url}")
        print(f"请求模型: {data['model']}")
        
        # 确保请求数据中的中文字符正确编码
        response = requests.post(url, headers=headers, json=data, timeout=30)
        print(f"响应状态码: {response.status_code}")
        
        response.raise_for_status()
        
        result = response.json()
        print(f"API响应结构: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            print(f"成功获取回复，长度: {len(content)}")
            return content
        else:
            print(f"API响应中没有choices或choices为空: {result}")
            return "抱歉，我现在无法回复。请稍后再试。"
            
    except requests.exceptions.HTTPError as e:
        print(f"HTTP错误: {e}")
        print(f"响应内容: {response.text if 'response' in locals() else 'No response'}")
        return "抱歉，AI服务暂时不可用。请稍后再试。"
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return "抱歉，AI服务暂时不可用。请稍后再试。"
    except Exception as e:
        print(f"处理OpenRouter响应时出错: {e}")
        import traceback
        traceback.print_exc()
        return "抱歉，处理回复时出现错误。请稍后再试。"

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# 创建数据库表
with app.app_context():
    db.create_all()
    
    # 创建示例数据（如果表是空的）
    if Note.query.count() == 0:
        example_note = Note(
            title='欢迎使用智能记事本',
            content='# 欢迎使用智能记事本\n\n这是一个功能强大的记事本应用，支持：\n\n- **Markdown编辑**：实时预览，语法高亮\n- **标签管理**：灵活的标签分类系统\n- **搜索功能**：快速查找笔记内容\n- **项目管理**：任务和项目组织\n\n开始你的创作之旅吧！',
            tags=json.dumps(['欢迎', '教程'], ensure_ascii=False)
        )
        db.session.add(example_note)
        db.session.commit()
        print('已创建示例笔记')

if __name__ == '__main__':
    print('智能记事本后端服务启动中...')
    print('API文档：')
    print('  GET  /api/health - 健康检查')
    print('  GET  /api/notes - 获取所有笔记')
    print('  POST /api/notes - 创建笔记')
    print('  GET  /api/notes/<id> - 获取单个笔记')
    print('  PUT  /api/notes/<id> - 更新笔记')
    print('  DELETE /api/notes/<id> - 删除笔记')
    print('  GET  /api/todos - 获取所有待办事项')
    print('  POST /api/todos - 创建待办事项')
    print('  GET  /api/todos/<id> - 获取单个待办事项')
    print('  PUT  /api/todos/<id> - 更新待办事项')
    print('  DELETE /api/todos/<id> - 删除待办事项')
    print('  GET  /api/projects - 获取所有项目')
    print('  POST /api/projects - 创建项目')
    print('  GET  /api/projects/<id> - 获取单个项目')
    print('  PUT  /api/projects/<id> - 更新项目')
    print('  DELETE /api/projects/<id> - 删除项目')
    print('  GET  /api/projects/<id>/tasks - 获取项目任务')
    print('  POST /api/tasks - 创建任务')
    print('  GET  /api/tasks/<id> - 获取单个任务')
    print('  PUT  /api/tasks/<id> - 更新任务')
    print('  DELETE /api/tasks/<id> - 删除任务')
    print('  POST /api/search - 搜索笔记')
    print('  POST /api/google-search - Google搜索')
    print('  POST /api/chat - AI聊天')
    
    # 从环境变量获取端口，默认为5001
    port = int(os.getenv('PORT', 5001))
    # 生产环境关闭debug模式
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)